import {SecureConfig} from './secureConfig';

export class Config {
  static jwtPlayerKey: string;

  static setup() {
    this.jwtPlayerKey = SecureConfig.getKey('jwtPlayerKey');
    this.env = SecureConfig.getKey('env') as any;
  }

  static env: 'DEV' | 'PROD' | 'LOCAL';
}
