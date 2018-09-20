import React, { Component } from 'react'
import {
    ActivityIndicator,
    Animated,
    Image,
    View
} from 'react-native'
import PropTypes from 'prop-types'
import RNFetchBlob from 'rn-fetch-blob'
import EStyleSheet from 'react-native-extended-stylesheet'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import * as imageActions from '../../actions/images'
import SubjectLoadingIndicator from './SubjectLoadingIndicator'

const mapDispatchToProps = (dispatch) => ({
    imageActions: bindActionCreators(imageActions, dispatch)
})

class ProgressIndicatingImage extends Component {
    constructor(props) {
        super(props)
        this.state = {
            imageIsLoaded: false,
            imageOpacity: new Animated.Value(0)
        }
        this.animateImageIfLoaded = this.animateImageIfLoaded.bind(this)
        this.unlinkImageOnLoad = false
    }

    componentDidUpdate(prevProps) {
        if (prevProps.localUri !== this.props.localUri) {
            this.animateImageIfLoaded()
        }
    }

    animateImageIfLoaded() {
        RNFetchBlob.fs.exists(this.props.localUri).then((fileExists) => {
            if (fileExists) {
                this.setState({
                    imageIsLoaded: true,
                }, () => {
                    Animated.timing( this.state.imageOpacity,
                        {
                            toValue: 1,
                            duration: 300
                        }
                    ).start()
                })
            }
        })
    }

    render() {
        if (!this.state.imageIsLoaded) {
            return  <SubjectLoadingIndicator />
        }

        return  <Animated.View style={[styles.imageContainer, { opacity: this.state.imageOpacity}]}>
                    <Image 
                        {...this.props}
                        source={{uri:this.props.localUri}}
                    />
                </Animated.View>
    }
}

const styles = EStyleSheet.create({
    imageContainer: {
        flex: 1
    }
})

ProgressIndicatingImage.propTypes = {
    localUri: PropTypes.string,
    style: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
    ]),
    onLoadEnd: PropTypes.func,
    imageActions: PropTypes.any,
}

export default connect(null, mapDispatchToProps)(ProgressIndicatingImage)
