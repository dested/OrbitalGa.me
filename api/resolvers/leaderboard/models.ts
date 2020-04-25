import {Field, Int, ObjectType, createUnionType} from 'type-graphql';
import {response} from '../../gqlUtils/response';

@ObjectType()
export class LeaderboardResponse {
  @Field(() => Int) aliveTime!: number;
  @Field(() => Boolean) anonymous!: boolean;
  @Field(() => Date) createdAt!: Date;
  @Field(() => Int) damageGiven!: number;
  @Field(() => Int) damageTaken!: number;
  @Field(() => Int) enemiesKilled!: number;
  @Field(() => Int) eventsParticipatedIn!: number;
  @Field(() => Int) score!: number;
  @Field(() => String) sessionId!: string;
  @Field(() => Int) shotsFired!: number;
  @Field(() => String) username!: string;
}
