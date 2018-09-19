import React, { Component } from 'react'
import {
    Animated,
    PanResponder
} from 'react-native'
import {
    Svg,
    Rect,
} from 'react-native-svg'
import PropTypes from 'prop-types'
import DragableSquare from './DragableSquare'
import R from 'ramda'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as drawingScreenAction from '../../../actions/drawingScreen'
import {
    distanceFromRange
} from '../drawingUtils'

const INITIAL_SQUARE_SIDE = 2

const mapStateToProps = (state) => ({
        shapes: state.drawingScreen.shapesInProgress
})

const mapDispatchToProps = (dispatch) => ({
    drawingScreenActions: bindActionCreators(drawingScreenAction, dispatch)
})

/**
 * This class sits over the image and has 3 different stats
 * 
 * Draw - The Svg layer responds to pan gestures and will draw shapes based on the users inputs.
 *        Please not there are two different SVGs that get drawn. The preview shapes and the actual shape.
 *        The preview shapes are just feedback for the shape the user will draw
 * 
 * Edit - The shapes drawn become editable. The user may move the shapes and change its size.
 * 
 * Delete - The shapes becomes deletable.
 */
class SvgOverlay extends Component {

    constructor(props) {
        super(props)
        this.count = 0

        this.state = {
            isDrawing: false,
            previewSquareX: 0,
            previewSquareY: 0,
            overlayHeight: 0,
            overlayWidth: 0
        }

        this.widthAnimated = new Animated.Value(INITIAL_SQUARE_SIDE)
        this.widthAnimated.addListener( ({value}) => {
            this.drawingRect.setNativeProps({
                width: `${value}`
            })
        })

        this.heightAnimated = new Animated.Value(INITIAL_SQUARE_SIDE),
        this.heightAnimated.addListener( ({value}) => {
            this.drawingRect.setNativeProps({
                height: `${value}`
            })
        })

        this.drawPanResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => this.props.mode === 'draw' ,
            onStartShouldSetPanResponderCapture: () => this.props.mode === 'draw',
            onMoveShouldSetPanResponder: () => this.props.mode === 'draw',
            onMoveShouldSetPanResponderCapture: () => this.props.mode === 'draw',
            onPanResponderGrant: (evt) => {
                const { locationX, locationY } = evt.nativeEvent
                this.setState({
                    isDrawing: true,
                    previewSquareX: locationX - INITIAL_SQUARE_SIDE,
                    previewSquareY: locationY - INITIAL_SQUARE_SIDE
                })
            },
            onPanResponderMove: (evt, gestureState) => {
                const { locationY } = evt.nativeEvent
                const { dx, dy } = gestureState
                this.widthAnimated.setValue(INITIAL_SQUARE_SIDE + dx)
                this.heightAnimated.setValue(INITIAL_SQUARE_SIDE + dy - distanceFromRange(locationY, 0,this.state.overlayHeight))
            },
            onPanResponderTerminationRequest: () => true,
            onPanResponderRelease: (evt, gestureState) => {
                const { previewSquareX, previewSquareY } = this.state
                const { dx, dy } = gestureState
                const { locationY } = evt.nativeEvent
                const shapeWidth = INITIAL_SQUARE_SIDE + dx
                const shapeHeight = INITIAL_SQUARE_SIDE + dy - distanceFromRange(locationY, 0,this.state.overlayHeight)
                const shape = {
                    type: 'rect',
                    color: this.props.color,
                    x: previewSquareX,
                    y: previewSquareY,
                    width: shapeWidth,
                    height: shapeHeight
                }

                this.setState({ isDrawing: false })
                
                if (Math.abs(shapeWidth) > 20 || Math.abs(shapeHeight) > 20) {
                    this.props.drawingScreenActions.addShape(shape)
                }
            },
            onPanResponderTerminate: () => {
                this.setState({
                    squareWidth: INITIAL_SQUARE_SIDE,
                    squareHeight: INITIAL_SQUARE_SIDE,
                    isDrawing: false,
                })


            },
            onShouldBlockNativeResponder: () => true
          });
    }

    renderShapes() {
        const shapeArray = []
        const convertObjectToComponent = (shape, index) => {
            const { type } = shape
            switch (type) {
                case ('rect'):
                    shapeArray.push(
                        <DragableSquare 
                            key={index} 
                            index={index}
                            isEditable={this.props.mode === 'edit'}
                            isDeletable={this.props.mode === 'erase'}
                            containerHeight={this.state.overlayHeight}
                            containerWidth={this.state.overlayWidth}
                            onDelete={() => {
                                this.props.drawingScreenActions.removeShapeAtIndex(index)
                            }}
                        />
                    )
            }
        }
        
        R.mapObjIndexed(convertObjectToComponent, this.props.shapes)
        return shapeArray
    }

    renderPreviewShape() {
        switch (this.props.shape) {
            case 'rect':
                return (
                    <Rect 
                        ref={ref => this.drawingRect = ref}
                        stroke="black"
                        strokeWidth={3}
                        fill="rgba(0, 0, 0, .5)"
                        x={this.state.previewSquareX} 
                        y={this.state.previewSquareY} 
                    />
                )
            default: 
                return null
        }
    }

    render() {
        return (
            <Svg
                { ...this.drawPanResponder.panHandlers }
                onLayout={({nativeEvent})=> {
                    const { height, width } = nativeEvent.layout
                    this.setState({
                        overlayHeight: height,
                        overlayWidth: width
                    })
                }}
                width={this.props.width}
                height={this.props.height}
                preserveAspectRatio="xMidYMid meet"
            >
                { this.state.isDrawing ? 
                    this.renderPreviewShape()
                    : null
                }
                {this.renderShapes()}
            </Svg>
        )
    }
}

SvgOverlay.propTypes = {
    color: PropTypes.string,
    shape: PropTypes.oneOf(['rect']),
    shapes: PropTypes.object,
    mode: PropTypes.oneOf(['draw', 'edit', 'erase', 'view']),
    drawingScreenActions: PropTypes.object,
    height: PropTypes.number,
    width: PropTypes.number
}

SvgOverlay.defaultProps = {
    color: 'black'
}

export default connect(mapStateToProps, mapDispatchToProps)(SvgOverlay)
