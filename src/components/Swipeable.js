import React, { Component } from 'react'
import {
  Animated,
  PanResponder,
  Platform,
  TouchableOpacity,
  View
} from 'react-native'
import EStyleSheet from 'react-native-extended-stylesheet'
import { connect } from 'react-redux'
import StyledText from './StyledText'
import SwipeSubject from './SwipeSubject'
import { clamp } from 'ramda'
import { setNextSubject } from '../actions/subject'
import PropTypes from 'prop-types';

//needs to be absolutely positioned below the question, otherwise it covers up
//everything above and prevents it from being touchable
const toTop = (Platform.OS === 'ios') ? 65 : 55
const SWIPE_THRESHOLD = 90

const mapStateToProps = (state, ownProps) => ({
  subject: state.classifier.subject[ownProps.workflow.id] || {},
  classification: state.classifier.classification[ownProps.workflow.id] || {},
  annotations: state.classifier.annotations[ownProps.workflow.id] || {},
  subjectSizes: {
    resizedHeight: state.main.device.subjectDisplayHeight,
    resizedWidth: state.main.device.subjectDisplayWidth
  },
  seenThisSession: state.classifier.seenThisSession[ownProps.workflow.id] || [],
  questionContainerHeight: state.classifier.questionContainerHeight[ownProps.workflow.id] || 0,
})

const mapDispatchToProps = (dispatch) => ({
  setNextSubject(workflowId) {
    dispatch(setNextSubject(workflowId))
  },
})

export class Swipeable extends Component {
  constructor(props) {
    super(props)
    this.state = {
      pan: new Animated.ValueXY(),
      enterAnim: new Animated.Value(.9),
    }
  }

  isSwipeGesture(gestureState) {
    return gestureState.dx > 5 || gestureState.dx < -5
  }

  componentWillMount() {
    this._panResponder = PanResponder.create({
    onStartShouldSetResponder: (evt, gestureState) => this.isSwipeGesture(gestureState),
    onMoveShouldSetPanResponder: (evt, gestureState) => this.isSwipeGesture(gestureState),

    onPanResponderGrant: () => {
      this.state.pan.setOffset({x: this.state.pan.x._value, y: this.state.pan.y._value})
      this.state.pan.setValue({x: 0, y: 0})
    },

    onPanResponderMove: Animated.event([
      null, {dx: this.state.pan.x, dy: this.state.pan.y + 100},
    ]),

    onPanResponderRelease: (e, {vx, vy}) => {
      this.state.pan.flattenOffset()
      let velocity

      if (vx >= 0) {
        velocity = clamp(3, 4, vx)
      } else if (vx < 0) {
        velocity = clamp(3, 4, vx * -1) * -1
      }

      if (Math.abs(this.state.pan.x._value) > SWIPE_THRESHOLD) {
        //negative=left (no = index 1)
        //positive=right (yes = index 0)
        const answer = ( this.state.pan.x._value < 0 ? 1 : 0 )
        Animated.decay(this.state.pan, {
          velocity: {x: velocity, y: vy},
          deceleration: 0.98
        }).start(this.props.onAnswered(answer))
      } else {
        Animated.spring(this.state.pan, {
          toValue: {x: 0, y: 0},
          friction: 4
        }).start()
      }
    }
    })
  }

  render() {
    const swipeableSize = { width: this.props.subjectSizes.resizedWidth, height: this.props.subjectSizes.resizedHeight + 10 }
    let pan = this.state.pan

    let [translateX, translateY] = [pan.x, pan.y]

    let rotate = pan.x.interpolate({inputRange: [-200, 0, 200], outputRange: ['-30deg', '0deg', '30deg']})
    

    let animatedCardStyles = {transform: [{translateX}, {translateY}, {rotate}]}

    return (
      <View style={[styles.container, {top: toTop + this.props.questionContainerHeight, height: this.props.subjectSizes.resizedHeight + 40}]}>
        <View style={styles.subjectContainer}>
          <Animated.View
            style={[animatedCardStyles, swipeableSize]}
            {...this._panResponder.panHandlers}>

            <TouchableOpacity
              activeOpacity={0.8}
              style={swipeableSize}
              onPress={this.props.showFullSize}>
              <SwipeSubject
                inFront={true}
                subject={this.props.subject}
                subjectSizes={this.props.subjectSizes}
                seenThisSession={this.props.seenThisSession}
                setNextSubject={() => this.props.setNextSubject(this.props.workflow.id) }
                pan={pan}
                leftAnswer={this.props.answers[0].label}
                rightAnswer={this.props.answers[1].label}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    )
  }
}

const styles = EStyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    left: 0,
    backgroundColor: 'transparent',
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  subjectContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    elevation: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
})

Swipeable.propTypes = {
  subject: PropTypes.shape({
    id: PropTypes.string
  }),
  nextSubject: PropTypes.shape({
    id: PropTypes.string
  }),
  subjectSizes: PropTypes.object,
  seenThisSession: PropTypes.arrayOf(PropTypes.string),
  workflow: PropTypes.shape({
    id: PropTypes.string,
    first_task: PropTypes.string,
    tasks: PropTypes.object,
  }),
  onAnswered: PropTypes.func,
  questionContainerHeight: PropTypes.number,
  setNextSubject: PropTypes.func,
  showFullSize: PropTypes.func,
  answers: PropTypes.arrayOf(PropTypes.object),
}

export default connect(mapStateToProps, mapDispatchToProps)(Swipeable)
