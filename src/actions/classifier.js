import apiClient from 'panoptes-client/lib/api-client'
import R from 'ramda'
import { addState, removeState, setState } from '../actions/index'
import { Actions } from 'react-native-router-flux'
import { Alert, Platform, Image} from 'react-native'
import { getAuthUser } from '../actions/auth'
import { loadSubjects, setSubjectsToDisplay } from '../actions/subject'
import { saveTutorialAsComplete, setUserProjectData } from '../actions/user';
import * as ActionConstants from '../constants/actions'

export function startNewClassification(workflow, project) {
  return (dispatch, getState) => {
    Promise.all([
      dispatch(requestClassifierData),
      dispatch(setState('loadingText', 'Loading Workflow...')),
      dispatch(setupProjectPreferences(workflow.id, project)),
      dispatch(fetchFieldGuide(workflow.id, project.id)),
      dispatch(fetchTutorials(workflow.id)).then(() => dispatch(setNeedsTutorial(workflow.id, project.id))),
      _setupClassification(dispatch, getState, workflow, true)
    ])
    .then(() => {
      dispatch(classifierDataSuccess)
    })
    .catch(() => {
      dispatch(classifierDataFailure)
      Alert.alert('Error', 'Sorry, but there was an error loading this workflow.',
        [{text: 'Go Back', onPress: () => { Actions.pop()}}]
      )
    })
  }
}

function _setupClassification(dispatch, getState, workflow, isFirstClassification) { 
  dispatch(setState('loadingText', 'Loading Subjects...'))
  return dispatch(loadSubjects(workflow.id))
    .then(() =>  {
      return dispatch(setSubjectsToDisplay(isFirstClassification, workflow.id))
    })
    .then(() => {
      const subject = getState().classifier.subject[workflow.id]
      return apiClient.type('classifications').create({
        annotations: [],
        metadata: {
          workflow_version: workflow.version,
          started_at: (new Date).toISOString(),
          user_agent: `${Platform.OS} Mobile App`,
          user_language: 'en',
          utc_offset: ((new Date).getTimezoneOffset() * 60).toString(),
          subject_dimensions: []
        },
        links: {
          project: workflow.links.project,
          workflow: workflow.id,
          subjects: [subject.id]
        }
      })
    })
    .then((classification) => {
      return dispatch(setClassificationForWorkflow(workflow.id, classification))
    })
}

export function saveThenStartNewClassification(workflow) {
  return (dispatch, getState) => {
    const classifier = getState().classifier
    const classification = classifier.classification[workflow.id]
    const subject = classifier.subject[workflow.id]
    const structureAnnotation = (a) => {
      return {task: a[0], value: a[1] } 
    }
    const annotations = R.map(structureAnnotation, R.toPairs(classifier.annotations[workflow.id]))

    if (!classifier.inPreviewMode) {
      Image.getSize(subject.display.src, (naturalWidth, naturalHeight) => {
        const subjectDimensions = {
          naturalWidth,
          naturalHeight,
          clientWidth: getState().main.device.subjectDisplayWidth,
          clientHeight: getState().main.device.subjectDisplayHeight
        }

        const updates = {
          annotations: annotations,
          completed: true,
          'metadata.session': getState().main.session.id,
          'metadata.finished_at': (new Date).toISOString(),
          'metadata.viewport': { width: getState().main.device.width, height: getState().main.device.height},
          'metadata.subject_dimensions.0': subjectDimensions
        }

        classification.update(updates)
        classification.save()
      }, () => {
        // If get size fails, we should still make the classification, just leave the dimensions metadata
        const updates = {
          annotations: annotations,
          completed: true,
          'metadata.session': getState().main.session.id,
          'metadata.finished_at': (new Date).toISOString(),
          'metadata.viewport': { width: getState().main.device.width, height: getState().main.device.height }
        }

        classification.update(updates)
        classification.save()
      });
    }

    //Remove this subject just saved from upcoming subjects
    const oldSubjectList = getState().classifier.upcomingSubjects[workflow.id]
    const newSubjectList = R.remove(0, 1, oldSubjectList)
    dispatch(setUpcomingSubjectsForWorkflow(workflow.id, newSubjectList))

    dispatch(setSubjectSeenThisSession(workflow.id, subject.id))
    _setupClassification(dispatch, getState, workflow, false)
    dispatch(initializeAnnotation(workflow.id))
  }
}

export function fetchFieldGuide(workflowId, projectId) {
  return (dispatch) => {
    return new Promise ((resolve) => {
      apiClient.type('field_guides').get({project_id: projectId}).then(([guide]) => {
        if (R.isEmpty(guide.items)) { //no items (clicked add but didn't add anything)
          return resolve()
        } else {
          let icons = {}
          guide.get('attached_images').then((images) => {
            R.forEach((image) => icons[image.id] = image, images)
            guide.icons = icons
            return resolve()
          }).finally(() => {
            dispatch(setGuideForWorkflow(workflowId, guide))
          })
        }
      }).catch(() => {
        return resolve()
      })
    })
  }
}

export function fetchTutorials(workflowID) {
  return dispatch => {
    return new Promise ((resolve) => {
      apiClient.type('tutorials').get({workflow_id: workflowID}).then(([tutorial]) => {
        let tutorialResource = tutorial
        let mediaByID = {}
        tutorialResource.get('attached_images').then((mediaResources) => {
          R.forEach((mediaResource) => mediaByID[mediaResource.id] = mediaResource, mediaResources)
        }).finally(() => {
          tutorialResource.mediaResources = mediaByID
          dispatch(addTutorial(workflowID, tutorialResource))
          resolve()
        })
      }).catch(() => { //does not exist for this project, that is OK
        dispatch(addTutorial(workflowID, {}))
        resolve()
      })
    })
  }
}

export function setupProjectPreferences(workflowID, project) {
  return (dispatch, getState) => {
    return new Promise ((resolve, reject) => {
      if (getState().user.isGuestUser){
        return resolve()
      }

      getAuthUser().then((userResource)=> {
        userResource.get('project_preferences', {project_id: project.id}).then (([projectPreferences]) => {
          //Before being able to classify on a project, the user needs to have their preference created if it doesn't exist
          if (projectPreferences) {
            return resolve()
          }

          const projectPreference = {
            links: { project: project.id },
            preferences: {}
          }

          apiClient.type('project_preferences').create(projectPreference).save().then(() => {
            const projectData = {
              name: project.display_name,
              slug: project.slug,
              activity_count: 0,
              sort_order: '',
              tutorials_completed_at: {}
            };
            dispatch(setUserProjectData(project.id, projectData));
            return resolve()
          }).catch(() => {
            return reject()
          })
        })
      })
    })
  }
}

export function setNeedsTutorial(workflowId, projectId) {
  return (dispatch, getState) => {
    return new Promise ((resolve) => {
      if (R.isEmpty(getState().classifier.tutorial[workflowId])) {
        dispatch(setNeedsTutorialAction(workflowId, false))
        return resolve()
      }

      const tutorialID = getState().classifier.tutorial[workflowId].id
      let needsTutorial = getState().classifier.needsTutorial[workflowId] !== undefined ? getState().classifier.needsTutorial[workflowId] : true

      if ((!getState().user.isGuestUser) && (getState().user.projects[projectId])) {
        needsTutorial = !getState().user.projects[projectId]['tutorials_completed_at'][tutorialID]
      }

      dispatch(setNeedsTutorialAction(workflowId, needsTutorial))
      return resolve()
    })
  }
}

export function setTutorialCompleted(workflowId, projectId) {
  return (dispatch, getState) => {
    dispatch(setNeedsTutorialAction(workflowId, false))

    if (getState().user.isGuestUser) {
      return
    }
    const now = new Date().toISOString()
    const tutorialId = getState().classifier.tutorial[workflowId].id

    getAuthUser().then((userResourse) => {
      userResourse.get('project_preferences', {project_id: projectId}).then (([projectPreferences]) => {
        if (!projectPreferences.preferences.tutorials_completed_at) {
          projectPreferences.preferences.tutorials_completed_at = {}
        }
        projectPreferences.update({[`preferences.tutorials_completed_at.${tutorialId}`]: now}).save()
        dispatch(saveTutorialAsComplete(projectId, tutorialId, now));
      })
    })
  }
}

export const addAnnotationToTask = (workflowId, task, annotation, asList) => ({
  type: ActionConstants.ADD_ANNOTATION_TO_TASK,
  workflowId,
  task,
  annotation,
  asList
})

export const removeAnnotationFromTask = (workflowId, task, annotation) => ({
  type: ActionConstants.REMOVE_ANNOTATION_FROM_TASK,
  workflowId,
  task,
  annotation,
})

export const setUpcomingSubjectsForWorkflow = (workflowId, upcomingSubjects) => ({
  type: ActionConstants.SET_UPCOMING_SUBJECTS,
  workflowId,
  upcomingSubjects
})

const setSubjectSeenThisSession = (workflowId, subjectId) => ({
  type: ActionConstants.SET_SUBJECT_SEEN_THIS_SESSION,
  workflowId,
  subjectId
})

export const setSubjectForWorkflowId = (workflowId, subject) => ({
  type: ActionConstants.SET_SUBJECT,
  workflowId,
  subject
})

export const setNextSubjectForWorkflowId = (workflowId, nextSubject) => ({
  type: ActionConstants.SET_NEXT_SUBJECT,
  workflowId,
  nextSubject
})

export const setQuestionContainerHeight = (workflowId, questionContainerHeight) => ({
  type: ActionConstants.SET_QUESTION_CONTAINER_HEIGHT,
  workflowId,
  questionContainerHeight
})

export const clearClassifierData = () => ({
  type: ActionConstants.CLEAR_CLASSIFIER_DATA
})

export const setClassifierTestMode = (isTestMode) => ({
  type: ActionConstants.SET_CLASSIFIER_TEST_MODE,
  isTestMode
})

const addTutorial = (workflowId, tutorial) => ({
  type: ActionConstants.ADD_CLASSIFIER_TUTORIAL,
  workflowId,
  tutorial
})

const setNeedsTutorialAction = (workflowId, needsTutorial) => ({
  type: ActionConstants.ADD_WORKFLOW_NEEDS_TUTORIAL,
  workflowId,
  needsTutorial
})

const setGuideForWorkflow = (workflowId, guide) => ({
  type: ActionConstants.SET_CLASSIFIER_GUIDE,
  workflowId,
  guide
})

const setClassificationForWorkflow = (workflowId, classification) => ({
  type: ActionConstants.SET_CLASSIFICATION,
  workflowId,
  classification
})

const initializeAnnotation = (workflowId) => ({
  type: ActionConstants.INITIALIZE_ANNOTATION,
  workflowId,
})

const requestClassifierData = {
  type: ActionConstants.REQUEST_CLASSIFIER_DATA
}

const classifierDataSuccess = {
  type: ActionConstants.CLASSIFIER_DATA_SUCCESS
}

const classifierDataFailure = {
  type: ActionConstants.CLASSIFIER_DATA_FAILURE
}
