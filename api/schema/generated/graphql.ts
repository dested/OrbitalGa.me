import {GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig} from 'graphql';
import {OrbitalContext} from '../orbitalContext';
export type Maybe<T> = T | null;
export type RequireFields<T, K extends keyof T> = {[X in Exclude<keyof T, K>]?: T[X]} & {[P in K]-?: NonNullable<T[P]>};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Date: Date;
};

export type Query = {
  __typename?: 'Query';
  placeholder?: Maybe<Scalars['Boolean']>;
  spectateServer?: Maybe<GameModel>;
};

export type Mutation = {
  __typename?: 'Mutation';
  login: LoginResponse;
  loginAnonymous: LoginResponse;
  placeholder?: Maybe<Scalars['Boolean']>;
  register: LoginResponse;
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

export type LoginResponse = LoginSuccessResponse | ErrorResponse;

export type LoginSuccessResponse = {
  __typename?: 'LoginSuccessResponse';
  jwt: Scalars['String'];
  gameModel?: Maybe<GameModel>;
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

export type LoginInput = {
  userName: Scalars['String'];
  password: Scalars['String'];
};

export type LoginAnonymousInput = {
  userName: Scalars['String'];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type StitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{[key in TKey]: TResult}, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, {[key in TKey]: TResult}, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type isTypeOfResolverFn<T = {}> = (obj: T, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  String: ResolverTypeWrapper<Scalars['String']>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  Query: ResolverTypeWrapper<{}>;
  Mutation: ResolverTypeWrapper<{}>;
  LoginResponse: ResolversTypes['LoginSuccessResponse'] | ResolversTypes['ErrorResponse'];
  LoginSuccessResponse: ResolverTypeWrapper<LoginSuccessResponse>;
  ErrorResponse: ResolverTypeWrapper<ErrorResponse>;
  GameModel: ResolverTypeWrapper<GameModel>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  LoginInput: LoginInput;
  LoginAnonymousInput: LoginAnonymousInput;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  String: Scalars['String'];
  Boolean: Scalars['Boolean'];
  Date: Scalars['Date'];
  Query: {};
  Mutation: {};
  LoginResponse: ResolversParentTypes['LoginSuccessResponse'] | ResolversParentTypes['ErrorResponse'];
  LoginSuccessResponse: LoginSuccessResponse;
  ErrorResponse: ErrorResponse;
  GameModel: GameModel;
  Int: Scalars['Int'];
  LoginInput: LoginInput;
  LoginAnonymousInput: LoginAnonymousInput;
}>;

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type QueryResolvers<
  ContextType = OrbitalContext,
  ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']
> = ResolversObject<{
  placeholder?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  spectateServer?: Resolver<Maybe<ResolversTypes['GameModel']>, ParentType, ContextType>;
}>;

export type MutationResolvers<
  ContextType = OrbitalContext,
  ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']
> = ResolversObject<{
  login?: Resolver<
    ResolversTypes['LoginResponse'],
    ParentType,
    ContextType,
    RequireFields<MutationLoginArgs, 'request'>
  >;
  loginAnonymous?: Resolver<
    ResolversTypes['LoginResponse'],
    ParentType,
    ContextType,
    RequireFields<MutationLoginAnonymousArgs, 'request'>
  >;
  placeholder?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  register?: Resolver<
    ResolversTypes['LoginResponse'],
    ParentType,
    ContextType,
    RequireFields<MutationRegisterArgs, 'request'>
  >;
}>;

export type LoginResponseResolvers<
  ContextType = OrbitalContext,
  ParentType extends ResolversParentTypes['LoginResponse'] = ResolversParentTypes['LoginResponse']
> = ResolversObject<{
  __resolveType: TypeResolveFn<'LoginSuccessResponse' | 'ErrorResponse', ParentType, ContextType>;
}>;

export type LoginSuccessResponseResolvers<
  ContextType = OrbitalContext,
  ParentType extends ResolversParentTypes['LoginSuccessResponse'] = ResolversParentTypes['LoginSuccessResponse']
> = ResolversObject<{
  jwt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  gameModel?: Resolver<Maybe<ResolversTypes['GameModel']>, ParentType, ContextType>;
  __isTypeOf?: isTypeOfResolverFn<ParentType>;
}>;

export type ErrorResponseResolvers<
  ContextType = OrbitalContext,
  ParentType extends ResolversParentTypes['ErrorResponse'] = ResolversParentTypes['ErrorResponse']
> = ResolversObject<{
  error?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: isTypeOfResolverFn<ParentType>;
}>;

export type GameModelResolvers<
  ContextType = OrbitalContext,
  ParentType extends ResolversParentTypes['GameModel'] = ResolversParentTypes['GameModel']
> = ResolversObject<{
  serverId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  serverUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: isTypeOfResolverFn<ParentType>;
}>;

export type Resolvers<ContextType = OrbitalContext> = ResolversObject<{
  Date?: GraphQLScalarType;
  Query?: QueryResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  LoginResponse?: LoginResponseResolvers;
  LoginSuccessResponse?: LoginSuccessResponseResolvers<ContextType>;
  ErrorResponse?: ErrorResponseResolvers<ContextType>;
  GameModel?: GameModelResolvers<ContextType>;
}>;

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = OrbitalContext> = Resolvers<ContextType>;
