import React, { Component } from 'react';
import {
    PanResponder,
    View,
} from 'react-native';
import PropTypes from 'prop-types';

const CORNER_RADIUS = 15;

const CircleView = ({ color, radius }) => {
    const circleStyle = {
        borderRadius: radius,
        height: 2 * radius,
        width: 2 * radius,
        backgroundColor: color
    };

    return (
        <View style={circleStyle} />
    );
};

CircleView.propTypes = {
    color: PropTypes.string,
    radius: PropTypes.number,
}


class DragableRect extends Component {

    constructor(props) {
        super(props)

        this.squareResponder = PanResponder.create({
            onStartShouldSetPanResponder: this.panIsTouchingPerimeter.bind(this),
            onPanResponderGrant: (evt) => {
                // this.props.onShapeDragStart()
                console.log('ello')
            },
            onPanResponderMove: () => {
                console.log('eryyy')
            }
        })
    }

    panIsTouchingPerimeter(evt) {
        const { locationX, locationY } = evt.nativeEvent
        const { width, height } = this.props
        return locationX < 4 || locationY < 4 || width - locationX < 4 || height - locationY < 4
    }

    render() {
        const { x, y, width, height, color } = this.props;
        const squareStyle = {
            color,
            left: x,
            top: y,
            width,
            height,
        };

        const upperLeftStyle = { 
            left: -CORNER_RADIUS,
            top: -CORNER_RADIUS
        }

        const upperRightStyle = { 
            right: -CORNER_RADIUS,
            top: -CORNER_RADIUS
        }

        const lowerLeftStyle = { 
            left: -CORNER_RADIUS,
            bottom: -CORNER_RADIUS
        }

        const lowerRightStyle = { 
            right: -CORNER_RADIUS,
            bottom: -CORNER_RADIUS
        }

        return (
            <View
                { ...this.squareResponder.panHandlers }
                style={[squareStyle, styles.container, styles.border]}
                pointerEvents="box-only"
            >
                <View styles={styles.squareView} />
                {/* Upper Left Corner */}
                <View style={[styles.container, upperLeftStyle]}>
                    <CircleView
                        radius={CORNER_RADIUS}
                        color={'black'}
                    />
                </View>

                {/* Upper Right Corner */}
                <View style={[styles.container, upperRightStyle]}>
                    <CircleView
                        radius={CORNER_RADIUS}
                        color={'black'}
                    />
                </View>

                {/* Lower Left Corner */}
                <View style={[styles.container, lowerLeftStyle]}>
                    <CircleView
                        radius={CORNER_RADIUS}
                        color={'black'}
                    />
                </View>

                {/* Lower Right Corner */}
                <View style={[styles.container, lowerRightStyle]}>
                    <CircleView
                        radius={CORNER_RADIUS}
                        color={'black'}
                    />
                </View>
            </View>
        );
    }
}

const styles = {
    squareView: {
        flex: 1,
    },
    container: {
        position: 'absolute',
    },
    border: {
        borderWidth: 4,
        borderColor: 'black'
    }
}

DragableRect.propTypes = {
    x: PropTypes.number,
    y: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
    color: PropTypes.string,
    onShapeDragStart: PropTypes.func, 
}



export default DragableRect;