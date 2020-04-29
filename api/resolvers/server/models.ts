import {Field, Int, ObjectType, createUnionType} from 'type-graphql';
import {response} from '../../gqlUtils/response';

@ObjectType()
export class ServerStats {}

export const ServerStatsResponse = response(ServerStats);

@ObjectType()
export class Servers {
  @Field(() => [Int]) serverIds!: number[];
}

export const ServersResponse = response(Servers);
