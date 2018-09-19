import React from 'react'
import PropTypes from 'prop-types'
import {
    Svg,
    Rect,
} from 'react-native-svg'
import R from 'ramda'

export const StaticSvgOverlay = ({ shapes, viewBox, width, height }) => {
    return (
        <Svg
            viewBox={viewBox}
            width={width}
            height={height}
        >
            {
                renderShapes(shapes)
            }
        </Svg>
    )
}

const renderShapes = (shapes) => {
    const array = []
    R.mapObjIndexed(({ type, color, x, y, width, height }, key) => {
        switch (type) {
            case 'rect':
                array.push(
                    <Rect
                        key={key}
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        stroke={color}
                        fill="transparent"
                        strokeWidth={4}
                    />
                )
        }
    }, shapes)
    return array
}

StaticSvgOverlay.propTypes = {
    shapes: PropTypes.object,
    viewBox: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number
}