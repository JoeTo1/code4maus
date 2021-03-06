import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import React from 'react';

/*
 * DOMElementRenderer wraps a DOM element, allowing it to be
 * rendered by React. It's up to the containing component
 * to retain a reference to the element prop, or else it
 * will be garbage collected after unmounting.
 */
class DOMElementRenderer extends React.Component {
    constructor (props) {
        super(props);
        this.setContainer = this.setContainer.bind(this);
    }
    componentDidMount () {
        this.container.appendChild(this.props.domElement);
    }
    componentWillUnmount () {
        this.container.removeChild(this.props.domElement);
    }
    setContainer (c) {
        this.container = c;
    }
    render () {
        // Look at me, I'm the React now!
        Object.assign(
            this.props.domElement,
            omit(this.props, ['domElement', 'children'])
        )
        return <div ref={this.setContainer} />;
    }
}

DOMElementRenderer.propTypes = {
    domElement: PropTypes.instanceOf(Element).isRequired
}

export default DOMElementRenderer;
