import React, {Component} from 'react';
import nipplejs from 'nipplejs';
import {JoystickManager, JoystickManagerOptions} from 'nipplejs';

type Props = {
  containerStyle: any;
  managerListener: (manager: JoystickManager) => void;
  options: JoystickManagerOptions;
};

export class JoyStick extends Component<Props> {
  static defaultProps = {
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

  private joyRef: React.RefObject<HTMLDivElement>;
  private manager?: JoystickManager;
  constructor(props: Props) {
    super(props);
    this.joyRef = React.createRef();
  }

  componentDidMount() {
    // delete window.PointerEvent;
    // delete (window as any).isMSPointer;
    this.manager = (nipplejs.create({...this.props.options, zone: this.joyRef.current!}) as unknown) as JoystickManager;
    this.joyRef.current!.style.touchAction = 'initial';
    this.props.managerListener(this.manager);
  }

  render() {
    return <div ref={this.joyRef} style={this.props.containerStyle} />;
  }
}
