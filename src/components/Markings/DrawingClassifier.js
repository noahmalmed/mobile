import React, { Component } from 'react'
import EStyleSheet from 'react-native-extended-stylesheet'
import {
    View
} from 'react-native'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import ClassificationPanel from '../classifier/ClassificationPanel'
import ImageWithSvgOverlay from './ImageWithSvgOverlay'
import Question from '../classifier/Question'
import * as imageActions from '../../actions/images'

const mapStateToProps = (state) => ({

})

const mapDispatchToProps = (dispatch) => ({
    imageActions: bindActionCreators(imageActions, dispatch)
})

class DrawingClassifier extends Component {

    constructor(props) {
        super(props)

        this.state = {
            imageIsLoaded: false,
            localImagePath: ''
        }
    }

    componentDidMount() {
        this.props.imageActions.loadImageToCache('https://facebook.github.io/react-native/docs/assets/favicon.png').then(localImagePath => {      
            this.setState({
                imageIsLoaded: true,
                localImagePath
            })
        })
    }

    render() {
        const classificationPanel =
            <View style={styles.container}>
                <ClassificationPanel
                    hasTutorial = { true }
                    // setQuestionVisibility = { true }
                >
                    <Question question="Watch the aeroplane fly, sky high!" />
                    <ImageWithSvgOverlay
                        imageIsLoaded={this.state.imageIsLoaded}
                        uri={this.state.localImagePath}
                    />
                </ClassificationPanel>
            </View>

        return classificationPanel
    }
}

const styles = EStyleSheet.create({
    container: {
      flex: 1,
      paddingBottom: 25
    },
    subjectContainer: {
        width: '100%',
      backgroundColor: 'blue',
      flex: 1,
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      margin: 20,
    },
})

DrawingClassifier.propTypes = {
    imageActions: PropTypes.any
}

export default connect(mapStateToProps, mapDispatchToProps)(DrawingClassifier)