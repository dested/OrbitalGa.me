import gql from 'graphql-tag';
import * as ApolloReactCommon from '@apollo/react-common';
import * as React from 'react';
import * as ApolloReactComponents from '@apollo/react-components';
import * as ApolloReactHoc from '@apollo/react-hoc';
import * as ApolloReactHooks from '@apollo/react-hooks';
export type Maybe<T> = T | null;
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  Boolean: boolean;
  /** Date custom scalar type */
  Date: Date;
  Float: number;
  ID: string;
  Int: number;
  String: string;
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
  serverId: Scalars['Int'];
  serverUrl: Scalars['String'];
};

export type LoginAnonymousInput = {
  userName: Scalars['String'];
};

export type LoginInput = {
  password: Scalars['String'];
  userName: Scalars['String'];
};

export type LoginResponse = LoginSuccessResponse | ErrorResponse;

export type LoginSuccessResponse = {
  __typename?: 'LoginSuccessResponse';
  gameModel?: Maybe<GameModel>;
  jwt: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  login: LoginResponse;
  loginAnonymous: LoginResponse;
  placeholder?: Maybe<Scalars['Boolean']>;
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

export type LoginMutationVariables = {
  password: Scalars['String'];
  userName: Scalars['String'];
};

export type LoginMutation = {__typename?: 'Mutation'} & {
  login:
    | ({__typename: 'LoginSuccessResponse'} & Pick<LoginSuccessResponse, 'jwt'> & {
          gameModel?: Maybe<{__typename?: 'GameModel'} & GameModelFragmentFragment>;
        })
    | ({__typename: 'ErrorResponse'} & Pick<ErrorResponse, 'error'>);
};

export type SpectateQueryVariables = {};

export type SpectateQuery = {__typename?: 'Query'} & {
  spectateServer?: Maybe<{__typename?: 'GameModel'} & GameModelFragmentFragment>;
};

export type GameModelFragmentFragment = {__typename?: 'GameModel'} & Pick<GameModel, 'serverId' | 'serverUrl'>;

export const GameModelFragmentFragmentDoc = gql`
  fragment GameModelFragment on GameModel {
    serverId
    serverUrl
  }
`;
export const LoginDocument = gql`
  mutation Login($userName: String!, $password: String!) {
    login(request: {userName: $userName, password: $password}) {
      __typename
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
  ${GameModelFragmentFragmentDoc}
`;
export type LoginMutationFn = ApolloReactCommon.MutationFunction<LoginMutation, LoginMutationVariables>;
export type LoginComponentProps = Omit<
  ApolloReactComponents.MutationComponentOptions<LoginMutation, LoginMutationVariables>,
  'mutation'
>;

export const LoginComponent = (props: LoginComponentProps) => (
  <ApolloReactComponents.Mutation<LoginMutation, LoginMutationVariables> mutation={LoginDocument} {...props} />
);

export type LoginProps<TChildProps = {}, TDataName extends string = 'mutate'> = {
  [key in TDataName]: ApolloReactCommon.MutationFunction<LoginMutation, LoginMutationVariables>;
} &
  TChildProps;
export function withLogin<TProps, TChildProps = {}, TDataName extends string = 'mutate'>(
  operationOptions?: ApolloReactHoc.OperationOption<
    TProps,
    LoginMutation,
    LoginMutationVariables,
    LoginProps<TChildProps, TDataName>
  >
) {
  return ApolloReactHoc.withMutation<TProps, LoginMutation, LoginMutationVariables, LoginProps<TChildProps, TDataName>>(
    LoginDocument,
    {
      alias: 'login',
      ...operationOptions,
    }
  );
}

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      userName: // value for 'userName'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<LoginMutation, LoginMutationVariables>
) {
  return ApolloReactHooks.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, baseOptions);
}
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = ApolloReactCommon.MutationResult<LoginMutation>;
export type LoginMutationOptions = ApolloReactCommon.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const SpectateDocument = gql`
  query Spectate {
    spectateServer {
      ...GameModelFragment
    }
  }
  ${GameModelFragmentFragmentDoc}
`;
export type SpectateComponentProps = Omit<
  ApolloReactComponents.QueryComponentOptions<SpectateQuery, SpectateQueryVariables>,
  'query'
>;

export const SpectateComponent = (props: SpectateComponentProps) => (
  <ApolloReactComponents.Query<SpectateQuery, SpectateQueryVariables> query={SpectateDocument} {...props} />
);

export type SpectateProps<TChildProps = {}, TDataName extends string = 'data'> = {
  [key in TDataName]: ApolloReactHoc.DataValue<SpectateQuery, SpectateQueryVariables>;
} &
  TChildProps;
export function withSpectate<TProps, TChildProps = {}, TDataName extends string = 'data'>(
  operationOptions?: ApolloReactHoc.OperationOption<
    TProps,
    SpectateQuery,
    SpectateQueryVariables,
    SpectateProps<TChildProps, TDataName>
  >
) {
  return ApolloReactHoc.withQuery<TProps, SpectateQuery, SpectateQueryVariables, SpectateProps<TChildProps, TDataName>>(
    SpectateDocument,
    {
      alias: 'spectate',
      ...operationOptions,
    }
  );
}

/**
 * __useSpectateQuery__
 *
 * To run a query within a React component, call `useSpectateQuery` and pass it any options that fit your needs.
 * When your component renders, `useSpectateQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSpectateQuery({
 *   variables: {
 *   },
 * });
 */
export function useSpectateQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<SpectateQuery, SpectateQueryVariables>
) {
  return ApolloReactHooks.useQuery<SpectateQuery, SpectateQueryVariables>(SpectateDocument, baseOptions);
}
export function useSpectateLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SpectateQuery, SpectateQueryVariables>
) {
  return ApolloReactHooks.useLazyQuery<SpectateQuery, SpectateQueryVariables>(SpectateDocument, baseOptions);
}
export type SpectateQueryHookResult = ReturnType<typeof useSpectateQuery>;
export type SpectateLazyQueryHookResult = ReturnType<typeof useSpectateLazyQuery>;
export type SpectateQueryResult = ApolloReactCommon.QueryResult<SpectateQuery, SpectateQueryVariables>;
