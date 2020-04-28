import {SecureConfig} from './secureConfig';

export class Config {
  static get jwtPlayerKey(): string {
    return SecureConfig.getKey('JWTPLAYERKEY');
  }
  static get jwtSpectateKey(): string {
    return SecureConfig.getKey('JWTSPECTATEKEY');
  }
  static get loadBalancerArn(): string {
    return SecureConfig.getKey('LOADBALANCERARN');
  }
  static get targetNameTemplate(): string {
    return SecureConfig.getKey('TARGETNAMETEMPLATE');
  }
}
