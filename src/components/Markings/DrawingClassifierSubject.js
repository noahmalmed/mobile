import React, { Component } from 'react'
import {
    View
} from 'react-native'
import PropTypes from 'prop-types'
import {
    Rect
} from 'react-native-svg'
import R from 'ramda'
import DrawingToolView from './components/DrawingToolView';

class DrawingClassifierSubject extends Component {

    constructor(props) {
        super(props)

        this.state = {
            containerDimensions: {
                width: 1,
                height: 1
            },
        }

        this.onContainerLayout = this.onContainerLayout.bind(this)
    }

    componentDidUpdate(prevProps, prevState) {
        if (!R.equals(prevProps.subjectDimensions, this.props.subjectDimensions) || !R.equals(prevState.containerDimensions, this.state.containerDimensions)) {
            const { naturalHeight, naturalWidth } = this.props.subjectDimensions
            const { height: containerHeight, width: containerWidth } = this.state.containerDimensions
            const aspectRatio = Math.min(containerHeight/naturalHeight, containerWidth/naturalWidth)
            const clientHeight = naturalHeight * aspectRatio
            const clientWidth = naturalWidth * aspectRatio

            this.props.onImageLayout({
                clientHeight,
                clientWidth,
            })
        }
    }

    onContainerLayout(containerDimensions) {
        this.setState({ containerDimensions })
    }

    renderShapes() {
        const shapeArray = []
        const convertObjectToComponent = (shape, index) => {
            const { type } = shape
            switch (type) {
                case ('rect'):
                    shapeArray.push(
                        <Rect 
                            key={index}
                            fill="transparent"
                            stroke={shape.color}
                            strokeWidth={4 * this.props.displayToNativeRatio}
                            { ... shape }
                        />
                    )
            }
        }
        
        R.mapObjIndexed(convertObjectToComponent, this.props.shapes)
        return shapeArray
    }

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.container}>
                    <DrawingToolView
                        imageIsLoaded={this.props.imageIsLoaded}
                        onContainerLayout={this.onContainerLayout}
                        onUndoButtonSelected={this.props.onUndoButtonSelected}
                        maxShapesDrawn={this.props.maxShapesDrawn}
                        drawingColor={this.props.drawingColor}
                        imageSource={this.props.imageSource}
                        canUndo={this.props.canUndo}
                        showDrawingButtons={this.props.showDrawingButtons}
                        canDraw={this.props.showDrawingButtons}
                        showAlreadySeenBanner={this.props.alreadySeen && this.props.imageIsLoaded}
                        showBlurView={this.props.showBlurView && this.props.imageIsLoaded}
                    />
                </View>
            </View>               
        )
    }
}

const styles = {
    container: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
        margin: 15,
        shadowColor: 'rgba(0,0,0,0.15)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 20,
    },
    svgContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    },
}

DrawingClassifierSubject.propTypes = {
    subjectDimensions: PropTypes.shape({
        naturalWidth: PropTypes.number,
        naturalHeight: PropTypes.number
    }),
    displayToNativeRatio: PropTypes.number,
    imageIsLoaded: PropTypes.bool,
    uri: PropTypes.string,
    annotations: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.oneOf(['square']),
        color: PropTypes.string,
        x: PropTypes.number,
        y: PropTypes.number,
        width: PropTypes.number,
        height: PropTypes.number
    })),
    onImageLayout: PropTypes.func,
    shapes: PropTypes.object,
    showBlurView: PropTypes.bool,
    alreadySeen: PropTypes.bool,
    showDrawingButtons: PropTypes.bool,
    onUndoButtonSelected: PropTypes.func,
    maxShapesDrawn: PropTypes.bool,
    drawingColor: PropTypes.string,
    imageSource: PropTypes.string,
    canUndo: PropTypes.bool
}

export default DrawingClassifierSubject