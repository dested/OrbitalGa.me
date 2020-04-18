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
  Private = 'PRIVATE'
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
  loginInput: LoginAnonymousInput;
};


export type MutationLoginArgs = {
  loginInput: LoginInput;
};


export type MutationRegisterArgs = {
  registerInput: LoginInput;
};

export type Query = {
   __typename?: 'Query';
  placeholder?: Maybe<Scalars['Boolean']>;
  spectateServer?: Maybe<GameModel>;
};

export type LoginMutationVariables = {
  userName: Scalars['String'];
  password: Scalars['String'];
};


export type LoginMutation = (
  { __typename?: 'Mutation' }
  & { login: (
    { __typename?: 'LoginSuccessResponse' }
    & Pick<LoginSuccessResponse, 'jwt'>
    & { gameModel?: Maybe<(
      { __typename?: 'GameModel' }
      & GameModelFragmentFragment
    )> }
  ) | (
    { __typename?: 'ErrorResponse' }
    & Pick<ErrorResponse, 'error'>
  ) }
);

export type SpectateQueryVariables = {};


export type SpectateQuery = (
  { __typename?: 'Query' }
  & { spectateServer?: Maybe<(
    { __typename?: 'GameModel' }
    & GameModelFragmentFragment
  )> }
);

export type GameModelFragmentFragment = (
  { __typename?: 'GameModel' }
  & Pick<GameModel, 'serverId' | 'serverUrl'>
);

export const GameModelFragment = gql`
    fragment GameModelFragment on GameModel {
  serverId
  serverUrl
}
    `;
export const LoginDocument = gql`
    mutation Login($userName: String!, $password: String!) {
  login(loginInput: {userName: $userName, password: $password}) {
    ... on ErrorResponse {
      error
    }
    ... on LoginSuccessResponse {
      gameModel {
        ...GameModelFragment
      }
      jwt
    }
  }
}
    ${GameModelFragment}`;
export const SpectateDocument = gql`
    query Spectate {
  spectateServer {
    ...GameModelFragment
  }
}
    ${GameModelFragment}`;