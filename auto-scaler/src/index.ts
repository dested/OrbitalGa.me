import {ELBv2, AutoScaling, EC2} from 'aws-sdk';
import {Utils} from '@common/utils/utils';
import * as config from './config.json';
console.log('started');

async function spinUp() {
  const ec2 = new EC2({region: 'us-west-2'});
  const elbv2 = new ELBv2({region: 'us-west-2'});
  const scaling = new AutoScaling({region: 'us-west-2'});
  try {
    let autoScalingGroup = await scaling
      .describeAutoScalingGroups({AutoScalingGroupNames: [config.autoScalingGroupName]})
      .promise();

    const size = autoScalingGroup.AutoScalingGroups[0].MinSize;
    console.log('current autoscaling size', size);
    const newSize = size + 1;
    await scaling
      .updateAutoScalingGroup({
        AutoScalingGroupName: config.autoScalingGroupName,
        LaunchConfigurationName: config.launchConfigurationName,
        MinSize: newSize,
        MaxSize: newSize,
      })
      .promise();
    console.log('size updated', newSize);

    console.log('waiting for load balancer available');
    await elbv2.waitFor('loadBalancerAvailable');
    console.log('load balancer available');

    let newInstanceId: string | undefined;
    while (true) {
      autoScalingGroup = await scaling
        .describeAutoScalingGroups({AutoScalingGroupNames: [config.autoScalingGroupName]})
        .promise();
      const instances = autoScalingGroup.AutoScalingGroups[0].Instances;
      console.log('Number of instances', instances.length);
      if (instances.length !== newSize) {
        console.log('waiting for new instance', +new Date());
        await Utils.timeout(5000);
      } else {
        const foundInstances = await ec2.describeInstances({InstanceIds: instances.map((a) => a.InstanceId)}).promise();
        newInstanceId = Utils.flattenArray(
          foundInstances.Reservations.map((a) => a.Instances.map((instance) => ({instance, time: instance.LaunchTime})))
        ).sort((a, b) => +b.time - +a.time)[0].instance.InstanceId;
        break;
      }
    }

    console.log('new instance available', newInstanceId);
    const newTargetGroup = await elbv2
      .createTargetGroup({
        HealthCheckEnabled: true,
        HealthCheckIntervalSeconds: 30,
        HealthCheckPath: '/',
        HealthCheckPort: config.websocketPort.toString(),
        HealthCheckProtocol: 'HTTP',
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 5,
        UnhealthyThresholdCount: 2,
        Name: config.targetNameTemplate + newSize,
        Port: config.websocketPort,
        Protocol: 'HTTP',
        VpcId: config.vpcId,
        TargetType: 'instance',
      })
      .promise();
    const newTargetGroupArn = newTargetGroup.TargetGroups.find(
      (a) => a.TargetGroupName === config.targetNameTemplate + newSize
    ).TargetGroupArn;
    console.log('new target group created', newTargetGroupArn);

    while (true) {
      console.log('getting instance running state');
      const status = await ec2.describeInstanceStatus({InstanceIds: [newInstanceId]}).promise();
      if (
        status.InstanceStatuses.length > 0 &&
        status.InstanceStatuses[0].InstanceState &&
        status.InstanceStatuses[0].InstanceState.Name
      ) {
        console.log(' instance running state', status.InstanceStatuses[0].InstanceState.Name);
        if (status.InstanceStatuses[0].InstanceState.Name === 'running') {
          break;
        }
      }
      console.log('sleeping');
      await Utils.timeout(2000);
    }

    console.log(`Finding ${newInstanceId} in default target group`);
    let found = false;
    const targetGroups = await elbv2.describeTargetGroups({LoadBalancerArn: config.loadBalancerArn}).promise();
    while (!found) {
      for (const targetGroup of targetGroups.TargetGroups) {
        const result = await elbv2.describeTargetHealth({TargetGroupArn: targetGroup.TargetGroupArn}).promise();
        console.log(`Checking target group: ${targetGroup.TargetGroupArn}`);
        if (result.TargetHealthDescriptions.find((a) => a.Target.Id === newInstanceId)) {
          found = true;
          console.log(`Removing ${newInstanceId} from target group: ${targetGroup.TargetGroupArn}`);
          await elbv2
            .deregisterTargets({
              TargetGroupArn: targetGroup.TargetGroupArn,
              Targets: [{Id: newInstanceId, Port: config.websocketPort}],
            })
            .promise();
          break;
        }
      }
      await Utils.timeout(2000);
    }

    await elbv2
      .registerTargets({
        TargetGroupArn: newTargetGroupArn,
        Targets: [{Id: newInstanceId, Port: config.websocketPort}],
      })
      .promise();
    console.log('registered new target to instance');

    const rules = await elbv2.describeRules({ListenerArn: config.listenerArn}).promise();
    console.log('got listener rules');

    const ruleArns = rules.Rules.map((a) => a.RuleArn);
    const newRuleArn = await elbv2
      .createRule({
        ListenerArn: config.listenerArn,
        Priority: ruleArns.length,
        Conditions: [
          {
            Field: 'path-pattern',
            Values: ['/' + newSize],
          },
        ],
        Actions: [
          {
            Type: 'forward',
            TargetGroupArn: newTargetGroupArn,
            Order: 1,
            ForwardConfig: {
              TargetGroups: [
                {
                  TargetGroupArn: newTargetGroupArn,
                  Weight: 1,
                },
              ],
              TargetGroupStickinessConfig: {
                Enabled: false,
              },
            },
          },
        ],
      })
      .promise();
    console.log('created routing rule');
  } catch (ex) {
    console.error(ex);
  }
  console.log('done');
}

async function spinDown() {
  const elbv2 = new ELBv2({region: 'us-west-2'});
  const scaling = new AutoScaling({region: 'us-west-2'});
  try {
    const autoScalingGroup = await scaling
      .describeAutoScalingGroups({AutoScalingGroupNames: [config.autoScalingGroupName]})
      .promise();

    const size = autoScalingGroup.AutoScalingGroups[0].MinSize;
    console.log('current autoscaling size', size);
    const newSize = size - 1;
    if (newSize < 1) {
      console.log('ERROR: Cannot go below one instance');
      return;
    }
    await scaling
      .updateAutoScalingGroup({
        AutoScalingGroupName: config.autoScalingGroupName,
        DesiredCapacity: newSize,
        MinSize: newSize,
        MaxSize: newSize,
      })
      .promise();
    console.log('size updated', newSize);

    console.log('waiting for load balancer available');
    await elbv2.waitFor('loadBalancerAvailable');
    console.log('load balancer available');

    const targetGroups = await elbv2.describeTargetGroups({LoadBalancerArn: config.loadBalancerArn}).promise();
    const targetGroupArn = targetGroups.TargetGroups.find(
      (a) => a.TargetGroupName === config.targetNameTemplate + size
    )!.TargetGroupArn;

    const rules = await elbv2.describeRules({ListenerArn: config.listenerArn}).promise();
    console.log('got listener rules');

    const ruleArn = rules.Rules.find((r) => r.Conditions.find((c) => c.Values.some((v) => v === '/' + size)));
    if (!ruleArn) {
      console.log(`ERROR: Could not find Rule for /${size}`);
      return;
    }
    console.log(`deleting rule: ${ruleArn.RuleArn}`);
    await elbv2.deleteRule({RuleArn: ruleArn.RuleArn}).promise();

    console.log(`deleting target group: ${targetGroupArn}`);
    await elbv2.deleteTargetGroup({TargetGroupArn: targetGroupArn}).promise();
  } catch (ex) {
    console.error(ex);
  }
}

async function setupFresh() {
  // modify the rule, change the default rule to fail to google, add a rule to route to the instance for /1
}

spinUp()
  .then((e) => console.log('done'))
  .catch((ex) => console.error(ex));
