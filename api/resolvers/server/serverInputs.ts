import {Field, Float, InputType, Int} from 'type-graphql';

@InputType()
export class ServerStatsInput {
  @Field() serverId!: number;
}

