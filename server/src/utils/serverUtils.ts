import fetch from 'node-fetch';
import * as ELBv2 from 'aws-sdk/clients/elbv2';
import {Utils} from '@common/utils/utils';
import {Config} from '../../../api/server-common';

export class ServerUtils {
  static async getLoadbalancerPath() {
    let newInstanceId: string;
    try {
      const ec2MagicalPath = 'http://169.254.169.254/latest/meta-data/instance-id';
      const response = await fetch(ec2MagicalPath);
      newInstanceId = await response.text();
    } catch (ex) {
      return '1';
    }
    const elbv2 = new ELBv2({region: Config.awsRegion});
    let found = false;
    const targetGroups = await elbv2
      .describeTargetGroups({
        LoadBalancerArn: Config.loadBalancerArn,
      })
      .promise();
    let paths: string[] = [];
    while (!found) {
      for (const targetGroup of targetGroups.TargetGroups!) {
        const result = await elbv2.describeTargetHealth({TargetGroupArn: targetGroup.TargetGroupArn!}).promise();
        console.log(`Checking target group: ${targetGroup.TargetGroupArn}`);
        if (result.TargetHealthDescriptions?.find((a) => a.Target?.Id === newInstanceId)) {
          found = true;
          console.log(`Found ${newInstanceId} in target group: ${targetGroup.TargetGroupName}`);
          const pathName = targetGroup.TargetGroupName!.replace(Config.targetNameTemplate, '');
          if (pathName.length === targetGroup.TargetGroupName!.length) {
            // this is a fix for not updating the default target group name
            paths.push('1');
          } else {
            paths.push(pathName);
          }
        }
      }
      await Utils.timeout(2000);
    }
    console.log(`Paths found: `, paths);
    if (paths.length > 1) {
      paths = paths.filter((a) => a !== '1');
      console.log(`Filtered to: `, paths[0]);
    }
    console.log('Up');

    return paths[0];
  }
}
