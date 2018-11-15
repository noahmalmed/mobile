import React, { Component } from 'react'
import {
    Animated,
    Platform,
    View
} from 'react-native'
import PropTypes from 'prop-types'
import { BlurView } from 'react-native-blur';
import Icon from 'react-native-vector-icons/FontAwesome'

import MarkableImage from './MarkableImage'
import DrawingButtons from './DrawingButtons'
import SubjectLoadingIndicator from '../../common/SubjectLoadingIndicator'
import AlreadySeenBanner from '../../classifier/AlreadySeenBanner'

class DrawingToolView extends Component {
    
    constructor(props) {
        super(props)

        this.state = {
            scale: new Animated.Value(1),
            mode: 'draw',
            containerDimensions: {
                width: 1,
                height: 1
            }
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.imageIsLoaded !== this.props.imageIsLoaded) {
            if (!this.props.imageIsLoaded) {
                this.setState({scale: new Animated.Value(0.8)})
            } else {
                this.animateScale()
            }
        }
    }

    animateScale() {
        Animated.spring(
            this.state.scale,
            {
                toValue: 1
            }
        ).start()
    }

    onContainerLayout(containerDimensions) {
        if (this.props.onContainerLayout) {
            this.props.onContainerLayout(containerDimensions)
        }
        this.setState({
            containerDimensions
        })
    }

    renderBlurView() {
        const expandIcon = <Icon name="arrows-alt" color="white" size={50} />

        return (
            <View style={styles.centeredOverlay}>
                {
                    Platform.OS === 'ios' ?
                        <BlurView style={[styles.centeredContent, this.state.containerDimensions]} blurType="light" blurAmount={2}>
                            { expandIcon }
                        </BlurView>

                    :
                        <View style={ [styles.centeredContent, styles.androidBlurView, this.state.containerDimensions] }>
                            { expandIcon }
                        </View>
                }
            </View>
        )
    }

    renderAlreadySeenBanner() { 
        return (
            <View pointerEvents="none" style={styles.centeredOverlay}>
                <View style={{...this.state.containerDimensions}}>
                    <AlreadySeenBanner />
                </View>
            </View>
        )
    }
    
    render() {
        return (
            <View style={styles.container}>
                {
                    this.props.imageIsLoaded ? 
                        <Animated.View style={[styles.container, {transform: [{scale: this.state.scale}]}]} >
                            <MarkableImage
                                onContainerLayout={this.onContainerLayout.bind(this)}
                                drawingColor={this.props.drawingColor}
                                source={this.props.imageSource}
                                mode={this.state.mode}
                                maxShapesDrawn={this.props.maxShapesDrawn}
                                canDraw={this.props.canDraw}
                            />
                            { this.props.showBlurView && this.renderBlurView() }
                            { this.props.showAlreadySeenBanner && this.renderAlreadySeenBanner() }
                        </Animated.View>
                    :
                        <SubjectLoadingIndicator />
                }
                {
                    this.props.showDrawingButtons && 
                        <DrawingButtons
                            onUndoButtonSelected={this.props.onUndoButtonSelected}
                            onModeButtonSelected={buttonType => this.setState({mode: buttonType})}
                            highlightedButton={this.state.mode}
                            canUndo={this.props.canUndo}
                        />
                }
            </View>
        )
    }
}

const styles = {
    container: {flex: 1},
    centeredOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    },
    centeredContent: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
    },
    androidBlurView: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)'
    },
}

DrawingToolView.propTypes = {
    maxShapesDrawn: PropTypes.bool,
    drawingColor: PropTypes.string,
    imageSource: PropTypes.string,
    canUndo: PropTypes.bool,
    onUndoButtonSelected: PropTypes.func,
    onContainerLayout: PropTypes.func,
    showDrawingButtons: PropTypes.bool,
    imageIsLoaded: PropTypes.bool,
    animateImage: PropTypes.func,
    canDraw: PropTypes.bool,
    showBlurView: PropTypes.bool,
    showAlreadySeenBanner: PropTypes.bool,
}

DrawingToolView.defaultProps = {
    imageIsLoaded: true,
    showDrawingButtons: true,
    canDraw: true
}

export default DrawingToolView