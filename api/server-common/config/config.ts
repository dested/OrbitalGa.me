import {SecureConfig} from './secureConfig';

export class Config {
  static env: 'DEV' | 'PROD' | 'LOCAL';
  static jwtPlayerKey: string;
  static jwtSpectateKey: string;
  static loadBalancerArn: string;
  static targetNameTemplate: string;

  static setup() {
    this.jwtPlayerKey = SecureConfig.getKey('jwtPlayerKey');
    this.jwtSpectateKey = SecureConfig.getKey('jwtSpectateKey');
    this.loadBalancerArn = SecureConfig.getKey('loadBalancerArn');
    this.targetNameTemplate = SecureConfig.getKey('targetNameTemplate');
    this.env = SecureConfig.getKey('env') as any;
  }
}
