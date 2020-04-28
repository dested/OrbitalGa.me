import {SecureConfig} from './secureConfig';

export class Config {
  static jwtPlayerKey: string;
  static jwtSpectateKey: string;
  static loadBalancerArn: string;
  static targetNameTemplate: string;

  static setup() {
    this.jwtPlayerKey = SecureConfig.getKey('JWTPLAYERKEY');
    this.jwtSpectateKey = SecureConfig.getKey('JWTSPECTATEKEY');
    this.loadBalancerArn = SecureConfig.getKey('LOADBALANCERARN');
    this.targetNameTemplate = SecureConfig.getKey('TARGETNAMETEMPLATE');
  }
}
