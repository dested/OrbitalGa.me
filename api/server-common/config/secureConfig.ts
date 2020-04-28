// tslint:disable-next-line:no-var-requires
require('dotenv').config();
import {EnvKeys, EnvKeysTypes} from '../../utils/envKeys';
import {SSM} from 'aws-sdk';

export class SecureConfig {
  static getKey(key: EnvKeysTypes): string {
    return process.env[key] as string;
  }
  static async setup() {
    try {
      if (process.env.ISLOCAL) {
        return;
      }
      if (process.env.$$READY) {
        return;
      }
      console.log('setting up kms');
      const ssm = new SSM();
      const kmsKeyDescription = 'kms-orbit-raiders';
      const keys = EnvKeys.map((k) => `/${kmsKeyDescription}-${process.env.ENV}/${k}`);

      const result = await ssm
        .getParameters({
          Names: keys,
          WithDecryption: true,
        })
        .promise();

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = result.Parameters?.find((p) => p.Name === key)?.Value;
        if (!value) {
          console.log('KEY NOT FOUND', key);
        } else {
          process.env[EnvKeys[i]] = value;
        }
      }
      process.env.$$READY = 'TRUE';
      console.log('done');
    } catch (ex) {
      console.error('bed shit', ex);
    }
  }
}
