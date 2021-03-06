import * as ActionConstants from '../constants/actions';
import store from 'react-native-simple-store';
import * as R from 'ramda';

const InitialUserState = { };

export default function user(state=InitialUserState, action) {
    switch (action.type) {
        case ActionConstants.SYNC_USER_STORE: {
            store.save('@zooniverse:user', { state })
            return state;
        }
        case ActionConstants.SET_USER_FROM_STORE: {
            if ( action.storeData !== undefined ) {
                return action.storeData;
            } else {
                return state;
            }
        }
        case ActionConstants.SET_USER_AVATAR: {
            return R.set(R.lensPath(['avatar']), action.avatar, state);
        }
        case ActionConstants.SET_USER_PROJECT_DATA: {
            return R.set(R.lensPath(['projects', action.projectId]), action.projectData, state);
        }
        case ActionConstants.SET_USER_TOTAL_CLASSIFICATIONS: {
            return R.set(R.lensPath(['totalClassifications']), action.totalClassifications, state);
        }
        case ActionConstants.SET_IS_GUEST_USER: {
            return R.set(R.lensPath(['isGuestUser']), action.isGuestUser, state);
        }
        case ActionConstants.SET_USER: {
            return action.user;
        }
        case ActionConstants.SIGN_OUT: {
            store.delete('@zooniverse:user');
            return {};
        }
        case ActionConstants.SET_PUSH_PROMPTED: {
            return R.set(R.lensPath(['pushPrompted']), action.value, state);
        }
        case ActionConstants.SET_TUTORIAL_COMPLETE: {
            const modifiedState = R.set(R.lensPath(['projects', action.projectId, 'tutorials_completed_at', action.tutorialId]), action.completionTime, state);
            return modifiedState;
        }
        default: 
            return state;
    }      
}
