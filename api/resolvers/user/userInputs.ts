import {Field, Float, InputType, Int} from 'type-graphql';

@InputType()
export class LoginInput {
  @Field() password!: string;
  @Field() userName!: string;
}

@InputType()
export class LoginAnonymousInput {
  @Field() userName!: string;
}
