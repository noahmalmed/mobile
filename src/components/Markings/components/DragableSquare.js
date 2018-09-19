import React from 'react'
import {
    PanResponder,
} from 'react-native'
import PropTypes from 'prop-types'
import { 
    G,
    Circle,
    Rect
} from 'react-native-svg'
import R from 'ramda'
import CloseButtonSVG from './CloseButtonSVG'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as drawingScreenAction from '../../../actions/drawingScreen'
import {
    distanceFromRange,
    distanceFromRangeToRange
} from '../drawingUtils'

const mapStateToProps = (state, ownProps) => {
    const shape = state.drawingScreen.shapesInProgress[ownProps.index]
    const { x, y, width, height, color } = shape
    return {
        shape,
        x,
        y,
        width,
        height,
        color
    }
}

const mapDispatchToProps = (dispatch) => ({
    drawingScreenActions: bindActionCreators(drawingScreenAction, dispatch)
})


class DragableSquare extends React.Component {

    createPanResponder = (onPanResponderMove, onPanResponderRelease) => PanResponder.create({
        // Ask to be the responder:
        onStartShouldSetPanResponder: () => this.props.isEditable,
        onStartShouldSetPanResponderCapture: () => this.props.isEditable,
        onMoveShouldSetPanResponder: () => this.props.isEditable,
        onMoveShouldSetPanResponderCapture: () => this.props.isEditable,
        onPanResponderTerminationRequest: () => this.props.isEditable,
        onShouldBlockNativeResponder: () => this.props.isEditable,
        onPanResponderMove,
        onPanResponderRelease,
    });

    componentDidUpdate(prevProps) {
        if (!R.equals(this.props.shape, prevProps.shape)) {
            this.setState({
                x: this.props.shape.x,
                y: this.props.shape.y,
                width: this.props.shape.width,
                height: this.props.shape.height
            })
        }
}

    constructor(props) {
        super(props)

        /**
         * Even though we receive props for positioning,
         * we use state to animate pan gestures. We do this 
         * so we don't update global state on pan gestures
         */
        this.state = { 
            x: props.shape.x,
            y: props.shape.y,
            width: props.shape.width,
            height: props.shape.height
        }
        
        /**
         * When this component is dragable, each corner of the square gets a circle.
         * Each Circle receives a pan responder that mutates the square,
         */
        this.topLeftResponder = this.createPanResponder(
            (evt, gestureState) => {
                const { dx, dy } = gestureState;
                const adjustedPanMovementY = dy - distanceFromRange(evt.nativeEvent.locationY, 0, this.props.containerHeight)
                const adjustedPanMovementX = dx - distanceFromRange(evt.nativeEvent.locationX, 0, this.props.containerWidth)
                this.setState({
                    x: this.props.shape.x + adjustedPanMovementX,
                    y: this.props.shape.y + adjustedPanMovementY,
                    width: this.props.shape.width - adjustedPanMovementX,
                    height: this.props.shape.height - adjustedPanMovementY
                })
            },
            (evt, gestureState) => {
                const { dx, dy } = gestureState;
                const adjustedPanMovementY = dy - distanceFromRange(evt.nativeEvent.locationY, 0, this.props.containerHeight)
                const adjustedPanMovementX = dx - distanceFromRange(evt.nativeEvent.locationX, 0, this.props.containerWidth)
                this.props.drawingScreenActions.mutateShapeAtIndex({
                    dx: adjustedPanMovementX, 
                    dy: adjustedPanMovementY, 
                    dw: - adjustedPanMovementX,
                    dh: - adjustedPanMovementY
                }, this.props.index)
            }
        )

        this.topRightResponder = this.createPanResponder(
            (evt, gestureState) => {
                const { dx, dy } = gestureState;
                const adjustedPanMovementY = dy - distanceFromRange(evt.nativeEvent.locationY, 0, this.props.containerHeight)
                const adjustedPanMovementX = dx - distanceFromRange(evt.nativeEvent.locationX, 0, this.props.containerWidth)
                this.setState({
                    y: this.props.shape.y + adjustedPanMovementY,
                    width: this.props.shape.width + adjustedPanMovementX,
                    height: this.props.shape.height - adjustedPanMovementY
                })
            },
            (evt, gestureState) => {
                const { dx, dy } = gestureState;
                const adjustedPanMovementY = dy - distanceFromRange(evt.nativeEvent.locationY, 0, this.props.containerHeight)
                const adjustedPanMovementX = dx - distanceFromRange(evt.nativeEvent.locationX, 0, this.props.containerWidth)
                this.props.drawingScreenActions.mutateShapeAtIndex({
                    dy: adjustedPanMovementY, 
                    dw: adjustedPanMovementX,
                    dh: - adjustedPanMovementY
                }, this.props.index)
            },
        )

        this.bottomLeftResponder = this.createPanResponder(
            (evt, gestureState) => {
                const { dx, dy } = gestureState;
                const adjustedPanMovementY = dy - distanceFromRange(evt.nativeEvent.locationY, 0, this.props.containerHeight)
                const adjustedPanMovementX = dx - distanceFromRange(evt.nativeEvent.locationX, 0, this.props.containerWidth)
                this.setState({
                    x: this.props.shape.x + adjustedPanMovementX,
                    width: this.props.shape.width - adjustedPanMovementX,
                    height: this.props.shape.height + adjustedPanMovementY
                })
            },
            (evt, gestureState) => {
                const { dx, dy } = gestureState;
                const adjustedPanMovementY = dy - distanceFromRange(evt.nativeEvent.locationY, 0, this.props.containerHeight)
                const adjustedPanMovementX = dx - distanceFromRange(evt.nativeEvent.locationX, 0, this.props.containerWidth)
                this.props.drawingScreenActions.mutateShapeAtIndex({
                    dx: adjustedPanMovementX, 
                    dw: -adjustedPanMovementX, 
                    dh: adjustedPanMovementY,
                }, this.props.index)
            },
        )

        this.bottomRightResponder = this.createPanResponder(
            (evt, gestureState) => {
                const { dx, dy } = gestureState;
                const adjustedPanMovementY = dy - distanceFromRange(evt.nativeEvent.locationY, 0, this.props.containerHeight)
                const adjustedPanMovementX = dx - distanceFromRange(evt.nativeEvent.locationX, 0, this.props.containerWidth)
                this.setState({
                    width: this.props.shape.width + adjustedPanMovementX,
                    height: this.props.shape.height + adjustedPanMovementY
                })
            },
            (evt, gestureState) => {
                const { dx, dy } = gestureState;
                const adjustedPanMovementY = dy - distanceFromRange(evt.nativeEvent.locationY, 0, this.props.containerHeight)
                const adjustedPanMovementX = dx - distanceFromRange(evt.nativeEvent.locationX, 0, this.props.containerWidth)
                this.props.drawingScreenActions.mutateShapeAtIndex({ 
                    dw: adjustedPanMovementX,
                    dh: adjustedPanMovementY
                }, this.props.index)
            },
        )

        /**
         * In addition, the square itself is dragable to change it's position.
         */

        this.squareDragResponder = this.createPanResponder(
            (evt, gestureState) => {
                const { dx, dy } = gestureState;
                const xSide = this.props.shape.x + dx
                const widthSide = xSide + this.state.width
                const ySide = this.props.shape.y + dy
                const heightSide = ySide + this.state.height
                this.setState({
                    x: xSide - distanceFromRangeToRange(Math.min(xSide, widthSide), Math.max(xSide,widthSide), 0, this.props.containerWidth),
                    y: ySide - distanceFromRangeToRange(Math.min(ySide, heightSide), Math.max(ySide,heightSide), 0, this.props.containerHeight)
                })
            },
            (evt, gestureState) => {
                const { dx, dy } = gestureState;
                const xSide = this.props.shape.x + dx
                const widthSide = xSide + this.state.width
                const ySide = this.props.shape.y + dy
                const heightSide = ySide + this.state.height
                this.props.drawingScreenActions.mutateShapeAtIndex({
                    dx: dx - distanceFromRangeToRange(Math.min(xSide, widthSide), Math.max(xSide,widthSide), 0, this.props.containerWidth),
                    dy: dy - distanceFromRangeToRange(Math.min(ySide, heightSide), Math.max(ySide,heightSide), 0, this.props.containerHeight)
                }, this.props.index)
            },
        )
    }

    render() { 
        return (
            <G>
                <Rect
                    {...this.squareDragResponder.panHandlers}
                    ref={ ref => this.rect = ref }
                    x={this.state.x}
                    y={this.state.y}
                    width={this.state.width}
                    height={this.state.height}
                    stroke={this.props.color}
                    strokeWidth="4"
                    fill="transparent"
                />
                <Circle
                    {...this.topLeftResponder.panHandlers }
                    ref={ ref => this.topLeftButton = ref }
                    x={this.state.x}
                    y={this.state.y}
                    fill={this.props.isEditable ? this.props.shape.color : 'transparent'}
                    r="8"
                />
                <Circle
                    {...this.topRightResponder.panHandlers }
                    ref={ ref => this.topRightButton = ref }
                    x={this.state.x + this.state.width}
                    y={this.state.y}
                    fill={this.props.isEditable ? this.props.shape.color : 'transparent'}
                    r="8"
                />
                <Circle
                    {...this.bottomLeftResponder.panHandlers}
                    ref={ ref => this.bottomLeftButton = ref }
                    x={this.state.x}
                    y={this.state.height + this.state.y}
                    fill={this.props.isEditable ? this.props.shape.color : 'transparent'}
                    r="8"
                />
                <Circle
                    {...this.bottomRightResponder.panHandlers}
                    ref={ ref => this.bottomRightButton = ref }
                    x={this.state.width + this.state.x}
                    y={this.state.height + this.state.y}
                    fill={this.props.isEditable ? this.props.shape.color : 'transparent'}
                    r="8"
                />
                {
                    
                    this.props.isDeletable ?
                        <G
                            x={this.state.width > 0 ? this.state.width + this.state.x : this.state.x}
                            y={(this.state.height > 0 ? this.state.y : this.state.y - Math.abs(this.state.height)) - 15}
                        >
                            <CloseButtonSVG
                                onPress={this.props.onDelete}
                            />
                        </G>
                    :
                        null
                }
            </G>
        )
    }
}

DragableSquare.propTypes = {
    index: PropTypes.string.isRequired,
    shape: PropTypes.shape({
        y: PropTypes.number,
        x: PropTypes.number,
        width: PropTypes.number,
        height: PropTypes.number,
        color: PropTypes.string,
    }),
    isEditable: PropTypes.bool,
    isDeletable: PropTypes.bool,
    onDelete: PropTypes.func,
    drawingScreenActions: PropTypes.object,
    containerHeight: PropTypes.number,
    containerWidth: PropTypes.number
}

export default connect(mapStateToProps, mapDispatchToProps)(DragableSquare)