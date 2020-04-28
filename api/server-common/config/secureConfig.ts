// tslint:disable-next-line:no-var-requires
require('dotenv').config();
import {EnvKeys, EnvKeysTypes} from '../../utils/envKeys';
import {SSM} from 'aws-sdk';

export class SecureConfig {
  static getKey(key: EnvKeysTypes): string {
    return process.env[key] as string;
  }
  static async setup() {
    if (process.env.ISLOCAL) {
      return;
    }
    const ssm = new SSM();
    const kmsKeyDescription = 'kms-orbit-raiders';
    const result = await ssm
      .getParameters({Names: EnvKeys.map((k) => `/${kmsKeyDescription}-${process.env.ENV}/${k}`), WithDecryption: true})
      .promise();
    for (const key of EnvKeys) {
      const value = result.Parameters?.find((p) => p.Name === key)?.Value;
      if (!value) {
        console.log('KEY NOT FOUND', key);
      } else {
        process.env[key] = value;
      }
    }
  }
}
