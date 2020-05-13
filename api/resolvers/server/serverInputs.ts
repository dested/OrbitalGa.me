import {Field, InputType} from 'type-graphql';

@InputType()
export class ServerStatsInput {
  @Field() serverId!: number;
}

