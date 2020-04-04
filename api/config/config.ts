import {SecureConfig} from './secureConfig';

export class Config {
  static dbConnection: string;
  static dbName: string;
  static jwtPlayerKey: string;

  static setup() {
    this.dbConnection = SecureConfig.getKey('dbConnection');
    this.dbName = SecureConfig.getKey('dbName');
    this.jwtPlayerKey = SecureConfig.getKey('jwtPlayerKey');
    this.env = SecureConfig.getKey('env') as any;
  }

  static env: 'DEV' | 'PROD' | 'LOCAL';
}
