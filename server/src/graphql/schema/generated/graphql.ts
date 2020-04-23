import gql from 'graphql-tag';
export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** Date custom scalar type */
  Date: Date;
};

export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE',
}

export type ErrorResponse = {
  __typename?: 'ErrorResponse';
  error: Scalars['String'];
};

export type GameModel = {
  __typename?: 'GameModel';
  serverId: Scalars['String'];
  serverUrl: Scalars['String'];
};

export type LoginAnonymousInput = {
  userName: Scalars['String'];
};

export type LoginInput = {
  userName: Scalars['String'];
  password: Scalars['String'];
};

export type LoginResponse = LoginSuccessResponse | ErrorResponse;

export type LoginSuccessResponse = {
  __typename?: 'LoginSuccessResponse';
  jwt: Scalars['String'];
  gameModel?: Maybe<GameModel>;
};

export type Mutation = {
  __typename?: 'Mutation';
  placeholder?: Maybe<Scalars['Boolean']>;
  loginAnonymous: LoginResponse;
  login: LoginResponse;
  register: LoginResponse;
};

export type MutationLoginAnonymousArgs = {
  request: LoginAnonymousInput;
};

export type MutationLoginArgs = {
  request: LoginInput;
};

export type MutationRegisterArgs = {
  request: LoginInput;
};

export type Query = {
  __typename?: 'Query';
  placeholder?: Maybe<Scalars['Boolean']>;
  spectateServer?: Maybe<GameModel>;
};

export type PlaceholderMutationVariables = {};

export type PlaceholderMutation = {__typename?: 'Mutation'} & Pick<Mutation, 'placeholder'>;

export const PlaceholderDocument = gql`
  mutation Placeholder {
    placeholder
  }
`;
