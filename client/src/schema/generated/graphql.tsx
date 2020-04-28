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
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The javascript `Date` as integer. Type represents date and time as number of milliseconds from start of UNIX epoch. */
  Timestamp: any;
};

export type ErrorResponse = {
  __typename?: 'ErrorResponse';
  error: Scalars['String'];
};

export type GameModel = {
  __typename?: 'GameModel';
  serverId: Scalars['Int'];
  serverUrl: Scalars['String'];
};

export type LeaderboardResponse = {
  __typename?: 'LeaderboardResponse';
  aliveTime: Scalars['Int'];
  anonymous: Scalars['Boolean'];
  createdAt: Scalars['Timestamp'];
  damageGiven: Scalars['Int'];
  damageTaken: Scalars['Int'];
  enemiesKilled: Scalars['Int'];
  eventsParticipatedIn: Scalars['Int'];
  score: Scalars['Int'];
  sessionId: Scalars['String'];
  shotsFired: Scalars['Int'];
  username: Scalars['String'];
};

export type LoginAnonymousInput = {
  userName: Scalars['String'];
};

export type LoginInput = {
  password: Scalars['String'];
  userName: Scalars['String'];
};

export type LoginSuccess = {
  __typename?: 'LoginSuccess';
  gameModel?: Maybe<GameModel>;
  jwt: Scalars['String'];
};

export type LoginSuccessResponse = LoginSuccess | ErrorResponse;

export type Mutation = {
  __typename?: 'Mutation';
  login: LoginSuccessResponse;
  loginAnonymous: LoginSuccessResponse;
  register: LoginSuccessResponse;
};

export type MutationLoginArgs = {
  request: LoginInput;
};

export type MutationLoginAnonymousArgs = {
  request: LoginAnonymousInput;
};

export type MutationRegisterArgs = {
  request: LoginInput;
};

export type Query = {
  __typename?: 'Query';
  spectate: SpectateResponse;
  leaderboard: Array<LeaderboardResponse>;
};

export type QueryLeaderboardArgs = {
  serverId?: Maybe<Scalars['Int']>;
};

export type SpectateResponse = {
  __typename?: 'SpectateResponse';
  gameModel?: Maybe<GameModel>;
  spectateJwt: Scalars['String'];
};

export type LoginMutationVariables = {
  userName: Scalars['String'];
  password: Scalars['String'];
};

export type LoginMutation = {__typename?: 'Mutation'} & {
  login:
    | ({__typename: 'LoginSuccess'} & Pick<LoginSuccess, 'jwt'> & {
          gameModel?: Maybe<{__typename?: 'GameModel'} & GameModelFragmentFragment>;
        })
    | ({__typename: 'ErrorResponse'} & Pick<ErrorResponse, 'error'>);
};

export type LoginAnonymousMutationVariables = {
  userName: Scalars['String'];
};

export type LoginAnonymousMutation = {__typename?: 'Mutation'} & {
  loginAnonymous:
    | ({__typename: 'LoginSuccess'} & Pick<LoginSuccess, 'jwt'> & {
          gameModel?: Maybe<{__typename?: 'GameModel'} & GameModelFragmentFragment>;
        })
    | ({__typename: 'ErrorResponse'} & Pick<ErrorResponse, 'error'>);
};

export type SpectateQueryVariables = {};

export type SpectateQuery = {__typename?: 'Query'} & {
  spectate: {__typename?: 'SpectateResponse'} & Pick<SpectateResponse, 'spectateJwt'> & {
      gameModel?: Maybe<{__typename?: 'GameModel'} & GameModelFragmentFragment>;
    };
};

export type LeaderboardQueryVariables = {};

export type LeaderboardQuery = {__typename?: 'Query'} & {
  leaderboard: Array<
    {__typename?: 'LeaderboardResponse'} & Pick<
      LeaderboardResponse,
      | 'aliveTime'
      | 'anonymous'
      | 'createdAt'
      | 'damageGiven'
      | 'damageTaken'
      | 'enemiesKilled'
      | 'eventsParticipatedIn'
      | 'score'
      | 'shotsFired'
      | 'username'
      | 'sessionId'
    >
  >;
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
      ... on LoginSuccess {
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
export const LoginAnonymousDocument = gql`
  mutation LoginAnonymous($userName: String!) {
    loginAnonymous(request: {userName: $userName}) {
      __typename
      ... on ErrorResponse {
        error
      }
      ... on LoginSuccess {
        gameModel {
          ...GameModelFragment
        }
        jwt
      }
    }
  }
  ${GameModelFragmentFragmentDoc}
`;
export type LoginAnonymousMutationFn = ApolloReactCommon.MutationFunction<
  LoginAnonymousMutation,
  LoginAnonymousMutationVariables
>;
export type LoginAnonymousComponentProps = Omit<
  ApolloReactComponents.MutationComponentOptions<LoginAnonymousMutation, LoginAnonymousMutationVariables>,
  'mutation'
>;

export const LoginAnonymousComponent = (props: LoginAnonymousComponentProps) => (
  <ApolloReactComponents.Mutation<LoginAnonymousMutation, LoginAnonymousMutationVariables>
    mutation={LoginAnonymousDocument}
    {...props}
  />
);

export type LoginAnonymousProps<TChildProps = {}, TDataName extends string = 'mutate'> = {
  [key in TDataName]: ApolloReactCommon.MutationFunction<LoginAnonymousMutation, LoginAnonymousMutationVariables>;
} &
  TChildProps;
export function withLoginAnonymous<TProps, TChildProps = {}, TDataName extends string = 'mutate'>(
  operationOptions?: ApolloReactHoc.OperationOption<
    TProps,
    LoginAnonymousMutation,
    LoginAnonymousMutationVariables,
    LoginAnonymousProps<TChildProps, TDataName>
  >
) {
  return ApolloReactHoc.withMutation<
    TProps,
    LoginAnonymousMutation,
    LoginAnonymousMutationVariables,
    LoginAnonymousProps<TChildProps, TDataName>
  >(LoginAnonymousDocument, {
    alias: 'loginAnonymous',
    ...operationOptions,
  });
}

/**
 * __useLoginAnonymousMutation__
 *
 * To run a mutation, you first call `useLoginAnonymousMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginAnonymousMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginAnonymousMutation, { data, loading, error }] = useLoginAnonymousMutation({
 *   variables: {
 *      userName: // value for 'userName'
 *   },
 * });
 */
export function useLoginAnonymousMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<LoginAnonymousMutation, LoginAnonymousMutationVariables>
) {
  return ApolloReactHooks.useMutation<LoginAnonymousMutation, LoginAnonymousMutationVariables>(
    LoginAnonymousDocument,
    baseOptions
  );
}
export type LoginAnonymousMutationHookResult = ReturnType<typeof useLoginAnonymousMutation>;
export type LoginAnonymousMutationResult = ApolloReactCommon.MutationResult<LoginAnonymousMutation>;
export type LoginAnonymousMutationOptions = ApolloReactCommon.BaseMutationOptions<
  LoginAnonymousMutation,
  LoginAnonymousMutationVariables
>;
export const SpectateDocument = gql`
  query Spectate {
    spectate {
      spectateJwt
      gameModel {
        ...GameModelFragment
      }
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
export const LeaderboardDocument = gql`
  query Leaderboard {
    leaderboard {
      aliveTime
      anonymous
      createdAt
      damageGiven
      damageTaken
      enemiesKilled
      eventsParticipatedIn
      score
      shotsFired
      username
      sessionId
    }
  }
`;
export type LeaderboardComponentProps = Omit<
  ApolloReactComponents.QueryComponentOptions<LeaderboardQuery, LeaderboardQueryVariables>,
  'query'
>;

export const LeaderboardComponent = (props: LeaderboardComponentProps) => (
  <ApolloReactComponents.Query<LeaderboardQuery, LeaderboardQueryVariables> query={LeaderboardDocument} {...props} />
);

export type LeaderboardProps<TChildProps = {}, TDataName extends string = 'data'> = {
  [key in TDataName]: ApolloReactHoc.DataValue<LeaderboardQuery, LeaderboardQueryVariables>;
} &
  TChildProps;
export function withLeaderboard<TProps, TChildProps = {}, TDataName extends string = 'data'>(
  operationOptions?: ApolloReactHoc.OperationOption<
    TProps,
    LeaderboardQuery,
    LeaderboardQueryVariables,
    LeaderboardProps<TChildProps, TDataName>
  >
) {
  return ApolloReactHoc.withQuery<
    TProps,
    LeaderboardQuery,
    LeaderboardQueryVariables,
    LeaderboardProps<TChildProps, TDataName>
  >(LeaderboardDocument, {
    alias: 'leaderboard',
    ...operationOptions,
  });
}

/**
 * __useLeaderboardQuery__
 *
 * To run a query within a React component, call `useLeaderboardQuery` and pass it any options that fit your needs.
 * When your component renders, `useLeaderboardQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLeaderboardQuery({
 *   variables: {
 *   },
 * });
 */
export function useLeaderboardQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<LeaderboardQuery, LeaderboardQueryVariables>
) {
  return ApolloReactHooks.useQuery<LeaderboardQuery, LeaderboardQueryVariables>(LeaderboardDocument, baseOptions);
}
export function useLeaderboardLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<LeaderboardQuery, LeaderboardQueryVariables>
) {
  return ApolloReactHooks.useLazyQuery<LeaderboardQuery, LeaderboardQueryVariables>(LeaderboardDocument, baseOptions);
}
export type LeaderboardQueryHookResult = ReturnType<typeof useLeaderboardQuery>;
export type LeaderboardLazyQueryHookResult = ReturnType<typeof useLeaderboardLazyQuery>;
export type LeaderboardQueryResult = ApolloReactCommon.QueryResult<LeaderboardQuery, LeaderboardQueryVariables>;
