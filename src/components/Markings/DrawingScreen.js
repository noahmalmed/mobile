import React from 'react'
import {
    Alert,
    Animated,
    Dimensions,
    Easing,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import * as drawingScreenAction from '../../actions/drawingScreen'
import { loadRemoteImageToCache } from '../../utils/imageUtils'
import NativeImage from '../../nativeModules/NativeImage'
import Icon from 'react-native-vector-icons/FontAwesome'
import { 
    DrawingTitle,
    DrawingButton,
    SvgOverlay,
    StaticSvgOverlay
} from './components'
import FontedText from '../common/FontedText';
import R from 'ramda'

const bottomViewPadding = 250
const contractedViewSize = 200

const mapDispatchToProps = (dispatch) => ({
    drawingScreenActions: bindActionCreators(drawingScreenAction, dispatch)
})

const mapStateToProps = (state) => ({
    pendingChanges: !R.isEmpty(state.drawingScreen.actions),
    shapes: state.drawingScreen.shapes
})

class DrawingScreen extends React.Component {

    expandedImageHeight = () => this.state.screenHeight - bottomViewPadding
    expandedOverlayHeight = () => this.state.screenHeight

    constructor(props) {
        super(props)
        this.state = {
            imageLoaded: false,
            imageWidth: 0,
            imageHeight: 0,
            localImagePath: '',
            screenHeight: Dimensions.get('window').height,
            drawingContainerHeightValue: contractedViewSize,
            drawingContainerHeight: new Animated.Value(contractedViewSize),
            overlayContainerHeight: new Animated.Value(contractedViewSize),
            drawingComponentsOpacity: new Animated.Value(0),
            expanded: false,
            mode: 'draw'
        }

        this.state.drawingContainerHeight.addListener( ({value}) => {
            this.setState({
                drawingContainerHeightValue: value
            })
        })

        this.toggleExpanded = this.toggleExpanded.bind(this)
        this.clearDrawingsAndClose = this.clearDrawingsAndClose.bind(this)
        this.saveDrawingsAndClose = this.saveDrawingsAndClose.bind(this)
    }

  componentDidMount() { 
    loadRemoteImageToCache('https://upload.wikimedia.org/wikipedia/commons/9/91/F-15_vertical_deploy.jpg').then(localImagePath => {      
        const nativeImage = new NativeImage(localImagePath)
        nativeImage.getImageSize().then(({width, height}) => {
            this.setState({
                imageWidth: width,
                imageHeight: height,
                localImagePath,
                imageLoaded: true
            })
        })
    })
  }

  render() {
    if (!this.state.imageLoaded) {
        return (
            <View style={styles.loadingContent}>
                <Text> Loading Content </Text>
            </View>
        )
    }

    const pathPrefix = Platform.OS === 'android' ? 'file://' : ''
    const imageSizeStyle = {
        width: this.state.imageContainerWidthAnimated,
        height: this.state.imageContainerHeightAnimated
    }

    return (
        <View style={styles.screenContainer}>
            <Animated.View style={styles.imageContainer}>
                <Animated.Image
                    source={{ uri: pathPrefix + this.state.localImagePath}}
                    style={[ imageSizeStyle, styles.image]}
                    resizeMode="contain"
                />
                <Animated.View style={[imageSizeStyle, styles.svgContainer]}>
                    <Animated.View style={[imageSizeStyle, styles.svgOverlayContainer]}>
                        <SvgOverlay
                            shape="rect"
                            mode={this.state.mode}
                        />
                    </Animated.View>
                </Animated.View>
                <DrawingTitle 
                    color="green" 
                    shape="rect" 
                    text="Draw Around Remote" 
                    style={styles.drawingTitle}
                />
                <TouchableOpacity style={styles.closeButton}>
                    <Icon name="times" style={styles.closeIcon} />
                </TouchableOpacity>
                <FontedText 
                    numberOfLines={2} 
                    style={styles.saveText}
                >
                    Save And Close 
                </FontedText>
                <View style={styles.drawingButtonsContainer}>
                    <DrawingButton 
                        style={styles.drawingButton}
                        type="edit"
                        enabled={this.state.mode === 'edit'}
                        onPress={() => this.setState({mode: 'edit'})}
                    />
                    <DrawingButton 
                        style={styles.drawingButton}
                        type="draw"
                        enabled={this.state.mode === 'draw'}
                        onPress={() => this.setState({mode: 'draw'})}
                    />
                    <DrawingButton 
                        style={styles.drawingButton} 
                        type="erase" 
                        enabled={this.state.mode === 'erase'}
                        onPress={() => this.setState({mode: 'erase'})}
                    />
                </View>
            </Animated.View>
        </View>
    )
  }
    clearDrawingsAndClose() {
        if (this.props.pendingChanges) {
            Alert.alert(
                'Are you sure?',
                'This will erase all of your recent annotations on this subject',
                [
                    {text: 'Yes', onPress: () => {
                        this.props.drawingScreenActions.cancelEdits()
                        this.toggleExpanded()
                    }},
                    {text: 'Cancel', style: 'cancel'},
                ],
            )
        } else {
            this.toggleExpanded()
        }
    }

    saveDrawingsAndClose() {
        this.props.drawingScreenActions.saveEdits()
        this.toggleExpanded()
    }

    toggleExpanded() {
        const isExpanding = !this.state.expanded
        const animations = [
            Animated.timing(
                this.state.drawingContainerHeight,
                {
                    toValue: isExpanding ? this.expandedImageHeight() : contractedViewSize,
                    duration: 300,
                    easing: Easing.linear
                }
            ),
            Animated.timing(
                this.state.overlayContainerHeight,
                {
                    toValue: isExpanding ? this.expandedOverlayHeight() : contractedViewSize,
                    duration: 300,
                    easing: Easing.linear
                }
            )
        ]

        const overlayAnimation = 
            Animated.timing(
                this.state.drawingComponentsOpacity,
                {
                    toValue: isExpanding ? 1 : 0,
                    duration: 300,
                    easing: Easing.linear
                }
            )

        if (isExpanding) {
            Animated.parallel(animations).start(() => {
                overlayAnimation.start(() => {
                    this.setState({
                        expanded: isExpanding
                    })
                })
            })
        } else {
            overlayAnimation.start(() => {
                Animated.parallel(animations).start(() => {
                this.setState({
                    expanded: isExpanding
                })
        })
            })
    }
    }
}

const styles = {
    loadingContent: {
        flex: 1,
        margin: 15,
        justifyContent: 'center',
        alignContent: 'center'
    },
    screenContainer: {
        flex: 1
    },
    imageContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center'
    },
    image: {
        backgroundColor: 'rgba(0,0,0,.4)', 
        alignSelf: 'center'
    },
    svgContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignSelf: 'center'
    },
    svgOverlayContainer: {
        alignSelf: 'center'
    },
    drawingTitle: {
        position: 'absolute',
        top: 15,
        left: 15
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 25
    }, 
    closeIcon: { 
        color: 'white',
        fontSize: 24
    },
    saveText: {
        width: 90,
        position: 'absolute',
        bottom: 25,
        right: 25,
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    drawingButtonsContainer: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        flexDirection: 'row'
    },
    drawingButton: {
        paddingRight: 10
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(DrawingScreen)