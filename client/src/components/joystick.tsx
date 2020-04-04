import React, {Component} from 'react';
import nipplejs, {JoystickManager} from 'nipplejs';

type Props = {
  options: nipplejs.JoystickManagerOptions;
  containerStyle: any;
  managerListener: (manager: JoystickManager) => void;
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
    this.manager = nipplejs.create({...this.props.options, zone: this.joyRef.current!});
    this.props.managerListener(this.manager);
  }

  render() {
    return <div ref={this.joyRef} style={this.props.containerStyle} />;
  }
}
