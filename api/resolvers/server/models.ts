import {Field, Int, ObjectType} from 'type-graphql';
import {response} from '../../gqlUtils/response';

@ObjectType()
export class ServerStats {
  @Field(() => Int) serverId!: number;
}

export const ServerStatsResponse = response(ServerStats);

@ObjectType()
export class Servers {
  @Field(() => [Int]) serverIds!: number[];
}

export const ServersResponse = response(Servers);
