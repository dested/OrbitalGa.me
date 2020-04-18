import {SSM} from 'aws-sdk';
let envDetails: any;

export class SecureConfig {
  static getKey(key: string): string {
    return envDetails[key];
  }
  static async setup() {
    if (envDetails) {
      return;
    }
    if (process.env.ENVDETAILS) {
      envDetails = JSON.parse(process.env.ENVDETAILS.replace(/\\"/g, '"'));
    } else {
      const ssm = new SSM();
      const result = await ssm.getParameter({Name: process.env.ENVKEY!, WithDecryption: true}).promise();
      envDetails = JSON.parse(result.Parameter!.Value!);
    }
  }
}
