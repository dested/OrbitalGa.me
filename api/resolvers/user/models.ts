import {Field, Int, ObjectType, createUnionType} from 'type-graphql';
import {response} from '../../gqlUtils/response';

@ObjectType()
export class LoginSuccess {
  @Field(() => GameModel, {nullable: true}) gameModel!: GameModel | null;
  @Field() jwt!: string;
}

@ObjectType()
export class GameModel {
  @Field(() => Int) serverId!: number;
  @Field() serverUrl!: string;
}

@ObjectType()
export class SpectateResponse {
  @Field(() => GameModel, {nullable: true}) gameModel!: GameModel | null;
  @Field() spectateJwt!: string;
}

export const LoginResponse = response(LoginSuccess);
