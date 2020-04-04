import React, { Component } from 'react';
import nipplejs from 'nipplejs';

export class JoyStick extends Component {
  constructor(props) {
    super(props);
    this.joyRef = React.createRef();
  }

  componentDidMount() {
    this.manager = nipplejs.create({ ...this.props.options, zone: this.joyRef.current });
    this.props.managerListener(this.manager);
  }

  render() {
    return (
      <div ref={this.joyRef} style={this.props.containerStyle} />
  );
  }
}

JoyStick.defaultProps = {
  options: {
    mode: 'semi',
    catchDistance: 150,
    color: 'white',
  },
  containerStyle: {
    width: '100%',
    height: '50vh',
    position: 'relative',
    background: 'linear-gradient(to right, #E684AE, #79CBCA, #77A1D3)',
  },
};



