import {
  DMMF,
  DMMFClass,
  Engine,
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
} from './runtime';

export { PrismaClientKnownRequestError }
export { PrismaClientUnknownRequestError }
export { PrismaClientRustPanicError }
export { PrismaClientInitializationError }
export { PrismaClientValidationError }

/**
 * Query Engine version: 2fb8f444d9cdf7c0beee7b041194b42d7a9ce1e6
 * Prisma Client JS version: 2.0.0-beta.3
 */
export declare type PrismaVersion = {
  client: string
}

export declare const prismaVersion: PrismaVersion 

/**
 * Utility Types
 */

declare type SelectAndInclude = {
  select: any
  include: any
}

declare type HasSelect = {
  select: any
}

declare type HasInclude = {
  include: any
}


declare type CheckSelect<T, S, U> = T extends SelectAndInclude
  ? 'Please either choose `select` or `include`'
  : T extends HasSelect
  ? U
  : T extends HasInclude
  ? U
  : S

/**
 * Get the type of the value, that the Promise holds.
 */
export declare type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

/**
 * Get the return type of a function which returns a Promise.
 */
export declare type PromiseReturnType<T extends (...args: any) => Promise<any>> = PromiseType<ReturnType<T>>


export declare type Enumerable<T> = T | Array<T>;

export declare type TrueKeys<T> = {
  [key in keyof T]: T[key] extends false | undefined | null ? never : key
}[keyof T]

/**
 * Subset
 * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
 */
export declare type Subset<T, U> = {
  [key in keyof T]: key extends keyof U ? T[key] : never;
};
declare class PrismaClientFetcher {
  private readonly prisma;
  private readonly debug;
  private readonly hooks?;
  constructor(prisma: PrismaClient<any, any>, debug?: boolean, hooks?: Hooks | undefined);
  request<T>(document: any, dataPath?: string[], rootField?: string, typeName?: string, isList?: boolean, callsite?: string, collectTimestamps?: any): Promise<T>;
  sanitizeMessage(message: string): string;
  protected unpack(document: any, data: any, path: string[], rootField?: string, isList?: boolean): any;
}


/**
 * Client
**/


export type Datasources = {
  db?: string
}

export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'

export interface PrismaClientOptions {
  datasources?: Datasources

  /**
   * @default "pretty"
   */
  errorFormat?: ErrorFormat

  log?: Array<LogLevel | LogDefinition>

  /**
   * You probably don't want to use this. `__internal` is used by internal tooling.
   */
  __internal?: {
    debug?: boolean
    hooks?: Hooks
    engine?: {
      cwd?: string
      binaryPath?: string
    }
    measurePerformance?: boolean
  }

  /**
   * Useful for pgbouncer
   */
  forceTransactions?: boolean
}

export type Hooks = {
  beforeRequest?: (options: {query: string, path: string[], rootField?: string, typeName?: string, document: any}) => any
}

/* Types for Logging */
export type LogLevel = 'info' | 'query' | 'warn'
export type LogDefinition = {
  level: LogLevel
  emit: 'stdout' | 'event'
}

export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
export type GetEvents<T extends Array<LogLevel | LogDefinition>> = GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]>

export type QueryEvent = {
  timestamp: Date
  query: string
  params: string
  duration: number
  target: string
}

export type LogEvent = {
  timestamp: Date
  message: string
  target: string
}
/* End Types for Logging */

// tested in getLogLevel.test.ts
export declare function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js (ORM replacement)
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://github.com/prisma/prisma/blob/master/docs/prisma-client-js/api.md).
 */
export declare class PrismaClient<T extends PrismaClientOptions = {}, U = keyof T extends 'log' ? T['log'] extends Array<LogLevel | LogDefinition> ? GetEvents<T['log']> : never : never> {
  /**
   * @private
   */
  private fetcher;
  /**
   * @private
   */
  private readonly dmmf;
  /**
   * @private
   */
  private connectionPromise?;
  /**
   * @private
   */
  private disconnectionPromise?;
  /**
   * @private
   */
  private readonly engineConfig;
  /**
   * @private
   */
  private readonly measurePerformance;
  /**
   * @private
   */
  private engine: Engine;
  /**
   * @private
   */
  private errorFormat: ErrorFormat;

  /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js (ORM replacement)
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://github.com/prisma/prisma/blob/master/docs/prisma-client-js/api.md).
   */
  constructor(optionsArg?: T);
  on<V extends U>(eventType: V, callback: V extends never ? never : (event: V extends 'query' ? QueryEvent : LogEvent) => void): void;
  /**
   * Connect with the database
   */
  connect(): Promise<void>;
  /**
   * @private
   */
  private runDisconnect;
  /**
   * Disconnect from the database
   */
  disconnect(): Promise<any>;
  /**
   * Makes a raw query
   * @example
   * ```
   * // Fetch all entries from the `User` table
   * const result = await prisma.raw`SELECT * FROM User;`
   * // Or
   * const result = await prisma.raw('SELECT * FROM User;')
   * 
   * // With parameters use prisma.raw``, values will be escaped automatically
   * const userId = '1'
   * const result = await prisma.raw`SELECT * FROM User WHERE id = ${userId};`
  * ```
  * 
  * Read more in our [docs](https://github.com/prisma/prisma/blob/master/docs/prisma-client-js/api.md#raw-database-access).
  */
  raw<T = any>(query: string | TemplateStringsArray, ...values: any[]): Promise<T>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): UserDelegate;

  /**
   * `prisma.globalLeaderboardEntry`: Exposes CRUD operations for the **GlobalLeaderboardEntry** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more GlobalLeaderboardEntries
    * const globalLeaderboardEntries = await prisma.globalLeaderboardEntry.findMany()
    * ```
    */
  get globalLeaderboardEntry(): GlobalLeaderboardEntryDelegate;

  /**
   * `prisma.server`: Exposes CRUD operations for the **Server** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Servers
    * const servers = await prisma.server.findMany()
    * ```
    */
  get server(): ServerDelegate;

  /**
   * `prisma.serverStat`: Exposes CRUD operations for the **ServerStat** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ServerStats
    * const serverStats = await prisma.serverStat.findMany()
    * ```
    */
  get serverStat(): ServerStatDelegate;
}



/**
 * Enums
 */

// Based on
// https://github.com/microsoft/TypeScript/issues/3192#issuecomment-261720275

export declare const OrderByArg: {
  asc: 'asc',
  desc: 'desc'
};

export declare type OrderByArg = (typeof OrderByArg)[keyof typeof OrderByArg]



/**
 * Model User
 */

export type User = {
  id: number
  createdAt: Date
  anonymous: boolean
  username: string
  passwordHash: string | null
}

export type UserSelect = {
  id?: boolean
  createdAt?: boolean
  anonymous?: boolean
  username?: boolean
  passwordHash?: boolean
  globalLeaderboardEntry?: boolean | FindManyGlobalLeaderboardEntryArgs
}

export type UserInclude = {
  globalLeaderboardEntry?: boolean | FindManyGlobalLeaderboardEntryArgs
}

export type UserGetPayload<
  S extends boolean | null | undefined | UserArgs,
  U = keyof S
> = S extends true
  ? User
  : S extends undefined
  ? never
  : S extends FindManyUserArgs
  ? 'include' extends U
    ? User  & {
      [P in TrueKeys<S['include']>]:
      P extends 'globalLeaderboardEntry'
      ? Array<GlobalLeaderboardEntryGetPayload<S['include'][P]>> : never
    }
  : 'select' extends U
    ? {
      [P in TrueKeys<S['select']>]:P extends keyof User ? User[P]
: 
      P extends 'globalLeaderboardEntry'
      ? Array<GlobalLeaderboardEntryGetPayload<S['select'][P]>> : never
    }
  : User
: User


export interface UserDelegate {
  /**
   * Find zero or one User.
   * @param {FindOneUserArgs} args - Arguments to find a User
   * @example
   * // Get one User
   * const user = await prisma.user.findOne({
   *   where: {
   *     // ... provide filter here
   *   }
   * })
  **/
  findOne<T extends FindOneUserArgs>(
    args: Subset<T, FindOneUserArgs>
  ): CheckSelect<T, UserClient<User | null>, UserClient<UserGetPayload<T> | null>>
  /**
   * Find zero or more Users.
   * @param {FindManyUserArgs=} args - Arguments to filter and select certain fields only.
   * @example
   * // Get all Users
   * const users = await prisma.user.findMany()
   * 
   * // Get first 10 Users
   * const users = await prisma.user.findMany({ first: 10 })
   * 
   * // Only select the `id`
   * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
   * 
  **/
  findMany<T extends FindManyUserArgs>(
    args?: Subset<T, FindManyUserArgs>
  ): CheckSelect<T, Promise<Array<User>>, Promise<Array<UserGetPayload<T>>>>
  /**
   * Create a User.
   * @param {UserCreateArgs} args - Arguments to create a User.
   * @example
   * // Create one User
   * const user = await prisma.user.create({
   *   data: {
   *     // ... data to create a User
   *   }
   * })
   * 
  **/
  create<T extends UserCreateArgs>(
    args: Subset<T, UserCreateArgs>
  ): CheckSelect<T, UserClient<User>, UserClient<UserGetPayload<T>>>
  /**
   * Delete a User.
   * @param {UserDeleteArgs} args - Arguments to delete one User.
   * @example
   * // Delete one User
   * const user = await prisma.user.delete({
   *   where: {
   *     // ... filter to delete one User
   *   }
   * })
   * 
  **/
  delete<T extends UserDeleteArgs>(
    args: Subset<T, UserDeleteArgs>
  ): CheckSelect<T, UserClient<User>, UserClient<UserGetPayload<T>>>
  /**
   * Update one User.
   * @param {UserUpdateArgs} args - Arguments to update one User.
   * @example
   * // Update one User
   * const user = await prisma.user.update({
   *   where: {
   *     // ... provide filter here
   *   },
   *   data: {
   *     // ... provide data here
   *   }
   * })
   * 
  **/
  update<T extends UserUpdateArgs>(
    args: Subset<T, UserUpdateArgs>
  ): CheckSelect<T, UserClient<User>, UserClient<UserGetPayload<T>>>
  /**
   * Delete zero or more Users.
   * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
   * @example
   * // Delete a few Users
   * const { count } = await prisma.user.deleteMany({
   *   where: {
   *     // ... provide filter here
   *   }
   * })
   * 
  **/
  deleteMany<T extends UserDeleteManyArgs>(
    args: Subset<T, UserDeleteManyArgs>
  ): Promise<BatchPayload>
  /**
   * Update zero or more Users.
   * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
   * @example
   * // Update many Users
   * const user = await prisma.user.updateMany({
   *   where: {
   *     // ... provide filter here
   *   },
   *   data: {
   *     // ... provide data here
   *   }
   * })
   * 
  **/
  updateMany<T extends UserUpdateManyArgs>(
    args: Subset<T, UserUpdateManyArgs>
  ): Promise<BatchPayload>
  /**
   * Create or update one User.
   * @param {UserUpsertArgs} args - Arguments to update or create a User.
   * @example
   * // Update or create a User
   * const user = await prisma.user.upsert({
   *   create: {
   *     // ... data to create a User
   *   },
   *   update: {
   *     // ... in case it already exists, update
   *   },
   *   where: {
   *     // ... the filter for the User we want to update
   *   }
   * })
  **/
  upsert<T extends UserUpsertArgs>(
    args: Subset<T, UserUpsertArgs>
  ): CheckSelect<T, UserClient<User>, UserClient<UserGetPayload<T>>>
  /**
   * 
   */
  count(args?: Omit<FindManyUserArgs, 'select' | 'include'>): Promise<number>
}

export declare class UserClient<T> implements Promise<T> {
  private readonly _dmmf;
  private readonly _fetcher;
  private readonly _queryType;
  private readonly _rootField;
  private readonly _clientMethod;
  private readonly _args;
  private readonly _dataPath;
  private readonly _errorFormat;
  private readonly _measurePerformance?;
  private _isList;
  private _callsite;
  private _requestPromise?;
  private _collectTimestamps?;
  constructor(_dmmf: DMMFClass, _fetcher: PrismaClientFetcher, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);
  readonly [Symbol.toStringTag]: 'PrismaClientPromise';

  globalLeaderboardEntry<T extends FindManyGlobalLeaderboardEntryArgs = {}>(args?: Subset<T, FindManyGlobalLeaderboardEntryArgs>): CheckSelect<T, Promise<Array<GlobalLeaderboardEntry>>, Promise<Array<GlobalLeaderboardEntryGetPayload<T>>>>;

  private get _document();
  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | Promise<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | Promise<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
  /**
   * Attaches a callback for only the rejection of the Promise.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never>(onrejected?: ((reason: any) => TResult | Promise<TResult>) | undefined | null): Promise<T | TResult>;
  /**
   * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
   * resolved value cannot be modified from the callback.
   * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
   * @returns A Promise for the completion of the callback.
   */
  finally(onfinally?: (() => void) | undefined | null): Promise<T>;
}

// Custom InputTypes

/**
 * User findOne
 */
export type FindOneUserArgs = {
  /**
   * Select specific fields to fetch from the User
  **/
  select?: UserSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: UserInclude | null
  /**
   * Filter, which User to fetch.
  **/
  where: UserWhereUniqueInput
}


/**
 * User findMany
 */
export type FindManyUserArgs = {
  /**
   * Select specific fields to fetch from the User
  **/
  select?: UserSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: UserInclude | null
  /**
   * Filter, which Users to fetch.
  **/
  where?: UserWhereInput | null
  /**
   * Determine the order of the Users to fetch.
  **/
  orderBy?: UserOrderByInput | null
  /**
   * Skip the first `n` Users.
  **/
  skip?: number | null
  /**
   * Get all Users that come after the User you provide with the current order.
  **/
  after?: UserWhereUniqueInput | null
  /**
   * Get all Users that come before the User you provide with the current order.
  **/
  before?: UserWhereUniqueInput | null
  /**
   * Get the first `n` Users.
  **/
  first?: number | null
  /**
   * Get the last `n` Users.
  **/
  last?: number | null
}


/**
 * User create
 */
export type UserCreateArgs = {
  /**
   * Select specific fields to fetch from the User
  **/
  select?: UserSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: UserInclude | null
  /**
   * The data needed to create a User.
  **/
  data: UserCreateInput
}


/**
 * User update
 */
export type UserUpdateArgs = {
  /**
   * Select specific fields to fetch from the User
  **/
  select?: UserSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: UserInclude | null
  /**
   * The data needed to update a User.
  **/
  data: UserUpdateInput
  /**
   * Choose, which User to update.
  **/
  where: UserWhereUniqueInput
}


/**
 * User updateMany
 */
export type UserUpdateManyArgs = {
  data: UserUpdateManyMutationInput
  where?: UserWhereInput | null
}


/**
 * User upsert
 */
export type UserUpsertArgs = {
  /**
   * Select specific fields to fetch from the User
  **/
  select?: UserSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: UserInclude | null
  /**
   * The filter to search for the User to update in case it exists.
  **/
  where: UserWhereUniqueInput
  /**
   * In case the User found by the `where` argument doesn't exist, create a new User with this data.
  **/
  create: UserCreateInput
  /**
   * In case the User was found with the provided `where` argument, update it with this data.
  **/
  update: UserUpdateInput
}


/**
 * User delete
 */
export type UserDeleteArgs = {
  /**
   * Select specific fields to fetch from the User
  **/
  select?: UserSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: UserInclude | null
  /**
   * Filter which User to delete.
  **/
  where: UserWhereUniqueInput
}


/**
 * User deleteMany
 */
export type UserDeleteManyArgs = {
  where?: UserWhereInput | null
}


/**
 * User without action
 */
export type UserArgs = {
  /**
   * Select specific fields to fetch from the User
  **/
  select?: UserSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: UserInclude | null
}



/**
 * Model GlobalLeaderboardEntry
 */

export type GlobalLeaderboardEntry = {
  id: number
  createdAt: Date
  updatedAt: Date
  score: number
  sessionId: string
  userId: number
  serverId: number
  aliveTime: number
  damageGiven: number
  damageTaken: number
  enemiesKilled: number
  eventsParticipatedIn: number
  shotsFired: number
}

export type GlobalLeaderboardEntrySelect = {
  id?: boolean
  createdAt?: boolean
  updatedAt?: boolean
  score?: boolean
  sessionId?: boolean
  userId?: boolean
  user?: boolean | UserArgs
  serverId?: boolean
  server?: boolean | ServerArgs
  aliveTime?: boolean
  damageGiven?: boolean
  damageTaken?: boolean
  enemiesKilled?: boolean
  eventsParticipatedIn?: boolean
  shotsFired?: boolean
}

export type GlobalLeaderboardEntryInclude = {
  user?: boolean | UserArgs
  server?: boolean | ServerArgs
}

export type GlobalLeaderboardEntryGetPayload<
  S extends boolean | null | undefined | GlobalLeaderboardEntryArgs,
  U = keyof S
> = S extends true
  ? GlobalLeaderboardEntry
  : S extends undefined
  ? never
  : S extends FindManyGlobalLeaderboardEntryArgs
  ? 'include' extends U
    ? GlobalLeaderboardEntry  & {
      [P in TrueKeys<S['include']>]:
      P extends 'user'
      ? UserGetPayload<S['include'][P]> :
      P extends 'server'
      ? ServerGetPayload<S['include'][P]> : never
    }
  : 'select' extends U
    ? {
      [P in TrueKeys<S['select']>]:P extends keyof GlobalLeaderboardEntry ? GlobalLeaderboardEntry[P]
: 
      P extends 'user'
      ? UserGetPayload<S['select'][P]> :
      P extends 'server'
      ? ServerGetPayload<S['select'][P]> : never
    }
  : GlobalLeaderboardEntry
: GlobalLeaderboardEntry


export interface GlobalLeaderboardEntryDelegate {
  /**
   * Find zero or one GlobalLeaderboardEntry.
   * @param {FindOneGlobalLeaderboardEntryArgs} args - Arguments to find a GlobalLeaderboardEntry
   * @example
   * // Get one GlobalLeaderboardEntry
   * const globalLeaderboardEntry = await prisma.globalLeaderboardEntry.findOne({
   *   where: {
   *     // ... provide filter here
   *   }
   * })
  **/
  findOne<T extends FindOneGlobalLeaderboardEntryArgs>(
    args: Subset<T, FindOneGlobalLeaderboardEntryArgs>
  ): CheckSelect<T, GlobalLeaderboardEntryClient<GlobalLeaderboardEntry | null>, GlobalLeaderboardEntryClient<GlobalLeaderboardEntryGetPayload<T> | null>>
  /**
   * Find zero or more GlobalLeaderboardEntries.
   * @param {FindManyGlobalLeaderboardEntryArgs=} args - Arguments to filter and select certain fields only.
   * @example
   * // Get all GlobalLeaderboardEntries
   * const globalLeaderboardEntries = await prisma.globalLeaderboardEntry.findMany()
   * 
   * // Get first 10 GlobalLeaderboardEntries
   * const globalLeaderboardEntries = await prisma.globalLeaderboardEntry.findMany({ first: 10 })
   * 
   * // Only select the `id`
   * const globalLeaderboardEntryWithIdOnly = await prisma.globalLeaderboardEntry.findMany({ select: { id: true } })
   * 
  **/
  findMany<T extends FindManyGlobalLeaderboardEntryArgs>(
    args?: Subset<T, FindManyGlobalLeaderboardEntryArgs>
  ): CheckSelect<T, Promise<Array<GlobalLeaderboardEntry>>, Promise<Array<GlobalLeaderboardEntryGetPayload<T>>>>
  /**
   * Create a GlobalLeaderboardEntry.
   * @param {GlobalLeaderboardEntryCreateArgs} args - Arguments to create a GlobalLeaderboardEntry.
   * @example
   * // Create one GlobalLeaderboardEntry
   * const user = await prisma.globalLeaderboardEntry.create({
   *   data: {
   *     // ... data to create a GlobalLeaderboardEntry
   *   }
   * })
   * 
  **/
  create<T extends GlobalLeaderboardEntryCreateArgs>(
    args: Subset<T, GlobalLeaderboardEntryCreateArgs>
  ): CheckSelect<T, GlobalLeaderboardEntryClient<GlobalLeaderboardEntry>, GlobalLeaderboardEntryClient<GlobalLeaderboardEntryGetPayload<T>>>
  /**
   * Delete a GlobalLeaderboardEntry.
   * @param {GlobalLeaderboardEntryDeleteArgs} args - Arguments to delete one GlobalLeaderboardEntry.
   * @example
   * // Delete one GlobalLeaderboardEntry
   * const user = await prisma.globalLeaderboardEntry.delete({
   *   where: {
   *     // ... filter to delete one GlobalLeaderboardEntry
   *   }
   * })
   * 
  **/
  delete<T extends GlobalLeaderboardEntryDeleteArgs>(
    args: Subset<T, GlobalLeaderboardEntryDeleteArgs>
  ): CheckSelect<T, GlobalLeaderboardEntryClient<GlobalLeaderboardEntry>, GlobalLeaderboardEntryClient<GlobalLeaderboardEntryGetPayload<T>>>
  /**
   * Update one GlobalLeaderboardEntry.
   * @param {GlobalLeaderboardEntryUpdateArgs} args - Arguments to update one GlobalLeaderboardEntry.
   * @example
   * // Update one GlobalLeaderboardEntry
   * const globalLeaderboardEntry = await prisma.globalLeaderboardEntry.update({
   *   where: {
   *     // ... provide filter here
   *   },
   *   data: {
   *     // ... provide data here
   *   }
   * })
   * 
  **/
  update<T extends GlobalLeaderboardEntryUpdateArgs>(
    args: Subset<T, GlobalLeaderboardEntryUpdateArgs>
  ): CheckSelect<T, GlobalLeaderboardEntryClient<GlobalLeaderboardEntry>, GlobalLeaderboardEntryClient<GlobalLeaderboardEntryGetPayload<T>>>
  /**
   * Delete zero or more GlobalLeaderboardEntries.
   * @param {GlobalLeaderboardEntryDeleteManyArgs} args - Arguments to filter GlobalLeaderboardEntries to delete.
   * @example
   * // Delete a few GlobalLeaderboardEntries
   * const { count } = await prisma.globalLeaderboardEntry.deleteMany({
   *   where: {
   *     // ... provide filter here
   *   }
   * })
   * 
  **/
  deleteMany<T extends GlobalLeaderboardEntryDeleteManyArgs>(
    args: Subset<T, GlobalLeaderboardEntryDeleteManyArgs>
  ): Promise<BatchPayload>
  /**
   * Update zero or more GlobalLeaderboardEntries.
   * @param {GlobalLeaderboardEntryUpdateManyArgs} args - Arguments to update one or more rows.
   * @example
   * // Update many GlobalLeaderboardEntries
   * const globalLeaderboardEntry = await prisma.globalLeaderboardEntry.updateMany({
   *   where: {
   *     // ... provide filter here
   *   },
   *   data: {
   *     // ... provide data here
   *   }
   * })
   * 
  **/
  updateMany<T extends GlobalLeaderboardEntryUpdateManyArgs>(
    args: Subset<T, GlobalLeaderboardEntryUpdateManyArgs>
  ): Promise<BatchPayload>
  /**
   * Create or update one GlobalLeaderboardEntry.
   * @param {GlobalLeaderboardEntryUpsertArgs} args - Arguments to update or create a GlobalLeaderboardEntry.
   * @example
   * // Update or create a GlobalLeaderboardEntry
   * const globalLeaderboardEntry = await prisma.globalLeaderboardEntry.upsert({
   *   create: {
   *     // ... data to create a GlobalLeaderboardEntry
   *   },
   *   update: {
   *     // ... in case it already exists, update
   *   },
   *   where: {
   *     // ... the filter for the GlobalLeaderboardEntry we want to update
   *   }
   * })
  **/
  upsert<T extends GlobalLeaderboardEntryUpsertArgs>(
    args: Subset<T, GlobalLeaderboardEntryUpsertArgs>
  ): CheckSelect<T, GlobalLeaderboardEntryClient<GlobalLeaderboardEntry>, GlobalLeaderboardEntryClient<GlobalLeaderboardEntryGetPayload<T>>>
  /**
   * 
   */
  count(args?: Omit<FindManyGlobalLeaderboardEntryArgs, 'select' | 'include'>): Promise<number>
}

export declare class GlobalLeaderboardEntryClient<T> implements Promise<T> {
  private readonly _dmmf;
  private readonly _fetcher;
  private readonly _queryType;
  private readonly _rootField;
  private readonly _clientMethod;
  private readonly _args;
  private readonly _dataPath;
  private readonly _errorFormat;
  private readonly _measurePerformance?;
  private _isList;
  private _callsite;
  private _requestPromise?;
  private _collectTimestamps?;
  constructor(_dmmf: DMMFClass, _fetcher: PrismaClientFetcher, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);
  readonly [Symbol.toStringTag]: 'PrismaClientPromise';

  user<T extends UserArgs = {}>(args?: Subset<T, UserArgs>): CheckSelect<T, UserClient<User | null>, UserClient<UserGetPayload<T> | null>>;

  server<T extends ServerArgs = {}>(args?: Subset<T, ServerArgs>): CheckSelect<T, ServerClient<Server | null>, ServerClient<ServerGetPayload<T> | null>>;

  private get _document();
  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | Promise<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | Promise<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
  /**
   * Attaches a callback for only the rejection of the Promise.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never>(onrejected?: ((reason: any) => TResult | Promise<TResult>) | undefined | null): Promise<T | TResult>;
  /**
   * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
   * resolved value cannot be modified from the callback.
   * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
   * @returns A Promise for the completion of the callback.
   */
  finally(onfinally?: (() => void) | undefined | null): Promise<T>;
}

// Custom InputTypes

/**
 * GlobalLeaderboardEntry findOne
 */
export type FindOneGlobalLeaderboardEntryArgs = {
  /**
   * Select specific fields to fetch from the GlobalLeaderboardEntry
  **/
  select?: GlobalLeaderboardEntrySelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: GlobalLeaderboardEntryInclude | null
  /**
   * Filter, which GlobalLeaderboardEntry to fetch.
  **/
  where: GlobalLeaderboardEntryWhereUniqueInput
}


/**
 * GlobalLeaderboardEntry findMany
 */
export type FindManyGlobalLeaderboardEntryArgs = {
  /**
   * Select specific fields to fetch from the GlobalLeaderboardEntry
  **/
  select?: GlobalLeaderboardEntrySelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: GlobalLeaderboardEntryInclude | null
  /**
   * Filter, which GlobalLeaderboardEntries to fetch.
  **/
  where?: GlobalLeaderboardEntryWhereInput | null
  /**
   * Determine the order of the GlobalLeaderboardEntries to fetch.
  **/
  orderBy?: GlobalLeaderboardEntryOrderByInput | null
  /**
   * Skip the first `n` GlobalLeaderboardEntries.
  **/
  skip?: number | null
  /**
   * Get all GlobalLeaderboardEntries that come after the GlobalLeaderboardEntry you provide with the current order.
  **/
  after?: GlobalLeaderboardEntryWhereUniqueInput | null
  /**
   * Get all GlobalLeaderboardEntries that come before the GlobalLeaderboardEntry you provide with the current order.
  **/
  before?: GlobalLeaderboardEntryWhereUniqueInput | null
  /**
   * Get the first `n` GlobalLeaderboardEntries.
  **/
  first?: number | null
  /**
   * Get the last `n` GlobalLeaderboardEntries.
  **/
  last?: number | null
}


/**
 * GlobalLeaderboardEntry create
 */
export type GlobalLeaderboardEntryCreateArgs = {
  /**
   * Select specific fields to fetch from the GlobalLeaderboardEntry
  **/
  select?: GlobalLeaderboardEntrySelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: GlobalLeaderboardEntryInclude | null
  /**
   * The data needed to create a GlobalLeaderboardEntry.
  **/
  data: GlobalLeaderboardEntryCreateInput
}


/**
 * GlobalLeaderboardEntry update
 */
export type GlobalLeaderboardEntryUpdateArgs = {
  /**
   * Select specific fields to fetch from the GlobalLeaderboardEntry
  **/
  select?: GlobalLeaderboardEntrySelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: GlobalLeaderboardEntryInclude | null
  /**
   * The data needed to update a GlobalLeaderboardEntry.
  **/
  data: GlobalLeaderboardEntryUpdateInput
  /**
   * Choose, which GlobalLeaderboardEntry to update.
  **/
  where: GlobalLeaderboardEntryWhereUniqueInput
}


/**
 * GlobalLeaderboardEntry updateMany
 */
export type GlobalLeaderboardEntryUpdateManyArgs = {
  data: GlobalLeaderboardEntryUpdateManyMutationInput
  where?: GlobalLeaderboardEntryWhereInput | null
}


/**
 * GlobalLeaderboardEntry upsert
 */
export type GlobalLeaderboardEntryUpsertArgs = {
  /**
   * Select specific fields to fetch from the GlobalLeaderboardEntry
  **/
  select?: GlobalLeaderboardEntrySelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: GlobalLeaderboardEntryInclude | null
  /**
   * The filter to search for the GlobalLeaderboardEntry to update in case it exists.
  **/
  where: GlobalLeaderboardEntryWhereUniqueInput
  /**
   * In case the GlobalLeaderboardEntry found by the `where` argument doesn't exist, create a new GlobalLeaderboardEntry with this data.
  **/
  create: GlobalLeaderboardEntryCreateInput
  /**
   * In case the GlobalLeaderboardEntry was found with the provided `where` argument, update it with this data.
  **/
  update: GlobalLeaderboardEntryUpdateInput
}


/**
 * GlobalLeaderboardEntry delete
 */
export type GlobalLeaderboardEntryDeleteArgs = {
  /**
   * Select specific fields to fetch from the GlobalLeaderboardEntry
  **/
  select?: GlobalLeaderboardEntrySelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: GlobalLeaderboardEntryInclude | null
  /**
   * Filter which GlobalLeaderboardEntry to delete.
  **/
  where: GlobalLeaderboardEntryWhereUniqueInput
}


/**
 * GlobalLeaderboardEntry deleteMany
 */
export type GlobalLeaderboardEntryDeleteManyArgs = {
  where?: GlobalLeaderboardEntryWhereInput | null
}


/**
 * GlobalLeaderboardEntry without action
 */
export type GlobalLeaderboardEntryArgs = {
  /**
   * Select specific fields to fetch from the GlobalLeaderboardEntry
  **/
  select?: GlobalLeaderboardEntrySelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: GlobalLeaderboardEntryInclude | null
}



/**
 * Model Server
 */

export type Server = {
  id: number
  createdAt: Date
  updatedAt: Date
  serverUrl: string
  live: boolean
}

export type ServerSelect = {
  id?: boolean
  createdAt?: boolean
  updatedAt?: boolean
  serverUrl?: boolean
  live?: boolean
  globalLeaderboardEntry?: boolean | FindManyGlobalLeaderboardEntryArgs
  serverStat?: boolean | FindManyServerStatArgs
}

export type ServerInclude = {
  globalLeaderboardEntry?: boolean | FindManyGlobalLeaderboardEntryArgs
  serverStat?: boolean | FindManyServerStatArgs
}

export type ServerGetPayload<
  S extends boolean | null | undefined | ServerArgs,
  U = keyof S
> = S extends true
  ? Server
  : S extends undefined
  ? never
  : S extends FindManyServerArgs
  ? 'include' extends U
    ? Server  & {
      [P in TrueKeys<S['include']>]:
      P extends 'globalLeaderboardEntry'
      ? Array<GlobalLeaderboardEntryGetPayload<S['include'][P]>> :
      P extends 'serverStat'
      ? Array<ServerStatGetPayload<S['include'][P]>> : never
    }
  : 'select' extends U
    ? {
      [P in TrueKeys<S['select']>]:P extends keyof Server ? Server[P]
: 
      P extends 'globalLeaderboardEntry'
      ? Array<GlobalLeaderboardEntryGetPayload<S['select'][P]>> :
      P extends 'serverStat'
      ? Array<ServerStatGetPayload<S['select'][P]>> : never
    }
  : Server
: Server


export interface ServerDelegate {
  /**
   * Find zero or one Server.
   * @param {FindOneServerArgs} args - Arguments to find a Server
   * @example
   * // Get one Server
   * const server = await prisma.server.findOne({
   *   where: {
   *     // ... provide filter here
   *   }
   * })
  **/
  findOne<T extends FindOneServerArgs>(
    args: Subset<T, FindOneServerArgs>
  ): CheckSelect<T, ServerClient<Server | null>, ServerClient<ServerGetPayload<T> | null>>
  /**
   * Find zero or more Servers.
   * @param {FindManyServerArgs=} args - Arguments to filter and select certain fields only.
   * @example
   * // Get all Servers
   * const servers = await prisma.server.findMany()
   * 
   * // Get first 10 Servers
   * const servers = await prisma.server.findMany({ first: 10 })
   * 
   * // Only select the `id`
   * const serverWithIdOnly = await prisma.server.findMany({ select: { id: true } })
   * 
  **/
  findMany<T extends FindManyServerArgs>(
    args?: Subset<T, FindManyServerArgs>
  ): CheckSelect<T, Promise<Array<Server>>, Promise<Array<ServerGetPayload<T>>>>
  /**
   * Create a Server.
   * @param {ServerCreateArgs} args - Arguments to create a Server.
   * @example
   * // Create one Server
   * const user = await prisma.server.create({
   *   data: {
   *     // ... data to create a Server
   *   }
   * })
   * 
  **/
  create<T extends ServerCreateArgs>(
    args: Subset<T, ServerCreateArgs>
  ): CheckSelect<T, ServerClient<Server>, ServerClient<ServerGetPayload<T>>>
  /**
   * Delete a Server.
   * @param {ServerDeleteArgs} args - Arguments to delete one Server.
   * @example
   * // Delete one Server
   * const user = await prisma.server.delete({
   *   where: {
   *     // ... filter to delete one Server
   *   }
   * })
   * 
  **/
  delete<T extends ServerDeleteArgs>(
    args: Subset<T, ServerDeleteArgs>
  ): CheckSelect<T, ServerClient<Server>, ServerClient<ServerGetPayload<T>>>
  /**
   * Update one Server.
   * @param {ServerUpdateArgs} args - Arguments to update one Server.
   * @example
   * // Update one Server
   * const server = await prisma.server.update({
   *   where: {
   *     // ... provide filter here
   *   },
   *   data: {
   *     // ... provide data here
   *   }
   * })
   * 
  **/
  update<T extends ServerUpdateArgs>(
    args: Subset<T, ServerUpdateArgs>
  ): CheckSelect<T, ServerClient<Server>, ServerClient<ServerGetPayload<T>>>
  /**
   * Delete zero or more Servers.
   * @param {ServerDeleteManyArgs} args - Arguments to filter Servers to delete.
   * @example
   * // Delete a few Servers
   * const { count } = await prisma.server.deleteMany({
   *   where: {
   *     // ... provide filter here
   *   }
   * })
   * 
  **/
  deleteMany<T extends ServerDeleteManyArgs>(
    args: Subset<T, ServerDeleteManyArgs>
  ): Promise<BatchPayload>
  /**
   * Update zero or more Servers.
   * @param {ServerUpdateManyArgs} args - Arguments to update one or more rows.
   * @example
   * // Update many Servers
   * const server = await prisma.server.updateMany({
   *   where: {
   *     // ... provide filter here
   *   },
   *   data: {
   *     // ... provide data here
   *   }
   * })
   * 
  **/
  updateMany<T extends ServerUpdateManyArgs>(
    args: Subset<T, ServerUpdateManyArgs>
  ): Promise<BatchPayload>
  /**
   * Create or update one Server.
   * @param {ServerUpsertArgs} args - Arguments to update or create a Server.
   * @example
   * // Update or create a Server
   * const server = await prisma.server.upsert({
   *   create: {
   *     // ... data to create a Server
   *   },
   *   update: {
   *     // ... in case it already exists, update
   *   },
   *   where: {
   *     // ... the filter for the Server we want to update
   *   }
   * })
  **/
  upsert<T extends ServerUpsertArgs>(
    args: Subset<T, ServerUpsertArgs>
  ): CheckSelect<T, ServerClient<Server>, ServerClient<ServerGetPayload<T>>>
  /**
   * 
   */
  count(args?: Omit<FindManyServerArgs, 'select' | 'include'>): Promise<number>
}

export declare class ServerClient<T> implements Promise<T> {
  private readonly _dmmf;
  private readonly _fetcher;
  private readonly _queryType;
  private readonly _rootField;
  private readonly _clientMethod;
  private readonly _args;
  private readonly _dataPath;
  private readonly _errorFormat;
  private readonly _measurePerformance?;
  private _isList;
  private _callsite;
  private _requestPromise?;
  private _collectTimestamps?;
  constructor(_dmmf: DMMFClass, _fetcher: PrismaClientFetcher, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);
  readonly [Symbol.toStringTag]: 'PrismaClientPromise';

  globalLeaderboardEntry<T extends FindManyGlobalLeaderboardEntryArgs = {}>(args?: Subset<T, FindManyGlobalLeaderboardEntryArgs>): CheckSelect<T, Promise<Array<GlobalLeaderboardEntry>>, Promise<Array<GlobalLeaderboardEntryGetPayload<T>>>>;

  serverStat<T extends FindManyServerStatArgs = {}>(args?: Subset<T, FindManyServerStatArgs>): CheckSelect<T, Promise<Array<ServerStat>>, Promise<Array<ServerStatGetPayload<T>>>>;

  private get _document();
  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | Promise<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | Promise<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
  /**
   * Attaches a callback for only the rejection of the Promise.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never>(onrejected?: ((reason: any) => TResult | Promise<TResult>) | undefined | null): Promise<T | TResult>;
  /**
   * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
   * resolved value cannot be modified from the callback.
   * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
   * @returns A Promise for the completion of the callback.
   */
  finally(onfinally?: (() => void) | undefined | null): Promise<T>;
}

// Custom InputTypes

/**
 * Server findOne
 */
export type FindOneServerArgs = {
  /**
   * Select specific fields to fetch from the Server
  **/
  select?: ServerSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: ServerInclude | null
  /**
   * Filter, which Server to fetch.
  **/
  where: ServerWhereUniqueInput
}


/**
 * Server findMany
 */
export type FindManyServerArgs = {
  /**
   * Select specific fields to fetch from the Server
  **/
  select?: ServerSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: ServerInclude | null
  /**
   * Filter, which Servers to fetch.
  **/
  where?: ServerWhereInput | null
  /**
   * Determine the order of the Servers to fetch.
  **/
  orderBy?: ServerOrderByInput | null
  /**
   * Skip the first `n` Servers.
  **/
  skip?: number | null
  /**
   * Get all Servers that come after the Server you provide with the current order.
  **/
  after?: ServerWhereUniqueInput | null
  /**
   * Get all Servers that come before the Server you provide with the current order.
  **/
  before?: ServerWhereUniqueInput | null
  /**
   * Get the first `n` Servers.
  **/
  first?: number | null
  /**
   * Get the last `n` Servers.
  **/
  last?: number | null
}


/**
 * Server create
 */
export type ServerCreateArgs = {
  /**
   * Select specific fields to fetch from the Server
  **/
  select?: ServerSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: ServerInclude | null
  /**
   * The data needed to create a Server.
  **/
  data: ServerCreateInput
}


/**
 * Server update
 */
export type ServerUpdateArgs = {
  /**
   * Select specific fields to fetch from the Server
  **/
  select?: ServerSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: ServerInclude | null
  /**
   * The data needed to update a Server.
  **/
  data: ServerUpdateInput
  /**
   * Choose, which Server to update.
  **/
  where: ServerWhereUniqueInput
}


/**
 * Server updateMany
 */
export type ServerUpdateManyArgs = {
  data: ServerUpdateManyMutationInput
  where?: ServerWhereInput | null
}


/**
 * Server upsert
 */
export type ServerUpsertArgs = {
  /**
   * Select specific fields to fetch from the Server
  **/
  select?: ServerSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: ServerInclude | null
  /**
   * The filter to search for the Server to update in case it exists.
  **/
  where: ServerWhereUniqueInput
  /**
   * In case the Server found by the `where` argument doesn't exist, create a new Server with this data.
  **/
  create: ServerCreateInput
  /**
   * In case the Server was found with the provided `where` argument, update it with this data.
  **/
  update: ServerUpdateInput
}


/**
 * Server delete
 */
export type ServerDeleteArgs = {
  /**
   * Select specific fields to fetch from the Server
  **/
  select?: ServerSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: ServerInclude | null
  /**
   * Filter which Server to delete.
  **/
  where: ServerWhereUniqueInput
}


/**
 * Server deleteMany
 */
export type ServerDeleteManyArgs = {
  where?: ServerWhereInput | null
}


/**
 * Server without action
 */
export type ServerArgs = {
  /**
   * Select specific fields to fetch from the Server
  **/
  select?: ServerSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: ServerInclude | null
}



/**
 * Model ServerStat
 */

export type ServerStat = {
  id: number
  createdAt: Date
  serverId: number
  tickIndex: number
  connections: number
  users: number
  spectators: number
  entities: number
  messages: number
  duration: number
  bytesSent: number
  bytesReceived: number
  totalBytesSent: number
  totalBytesReceived: number
  boardWidth: number
  memHeapUsed: number
  memHeapTotal: number
  memExternal: number
  entityGroupCount: string
}

export type ServerStatSelect = {
  id?: boolean
  createdAt?: boolean
  serverId?: boolean
  server?: boolean | ServerArgs
  tickIndex?: boolean
  connections?: boolean
  users?: boolean
  spectators?: boolean
  entities?: boolean
  messages?: boolean
  duration?: boolean
  bytesSent?: boolean
  bytesReceived?: boolean
  totalBytesSent?: boolean
  totalBytesReceived?: boolean
  boardWidth?: boolean
  memHeapUsed?: boolean
  memHeapTotal?: boolean
  memExternal?: boolean
  entityGroupCount?: boolean
}

export type ServerStatInclude = {
  server?: boolean | ServerArgs
}

export type ServerStatGetPayload<
  S extends boolean | null | undefined | ServerStatArgs,
  U = keyof S
> = S extends true
  ? ServerStat
  : S extends undefined
  ? never
  : S extends FindManyServerStatArgs
  ? 'include' extends U
    ? ServerStat  & {
      [P in TrueKeys<S['include']>]:
      P extends 'server'
      ? ServerGetPayload<S['include'][P]> : never
    }
  : 'select' extends U
    ? {
      [P in TrueKeys<S['select']>]:P extends keyof ServerStat ? ServerStat[P]
: 
      P extends 'server'
      ? ServerGetPayload<S['select'][P]> : never
    }
  : ServerStat
: ServerStat


export interface ServerStatDelegate {
  /**
   * Find zero or one ServerStat.
   * @param {FindOneServerStatArgs} args - Arguments to find a ServerStat
   * @example
   * // Get one ServerStat
   * const serverStat = await prisma.serverStat.findOne({
   *   where: {
   *     // ... provide filter here
   *   }
   * })
  **/
  findOne<T extends FindOneServerStatArgs>(
    args: Subset<T, FindOneServerStatArgs>
  ): CheckSelect<T, ServerStatClient<ServerStat | null>, ServerStatClient<ServerStatGetPayload<T> | null>>
  /**
   * Find zero or more ServerStats.
   * @param {FindManyServerStatArgs=} args - Arguments to filter and select certain fields only.
   * @example
   * // Get all ServerStats
   * const serverStats = await prisma.serverStat.findMany()
   * 
   * // Get first 10 ServerStats
   * const serverStats = await prisma.serverStat.findMany({ first: 10 })
   * 
   * // Only select the `id`
   * const serverStatWithIdOnly = await prisma.serverStat.findMany({ select: { id: true } })
   * 
  **/
  findMany<T extends FindManyServerStatArgs>(
    args?: Subset<T, FindManyServerStatArgs>
  ): CheckSelect<T, Promise<Array<ServerStat>>, Promise<Array<ServerStatGetPayload<T>>>>
  /**
   * Create a ServerStat.
   * @param {ServerStatCreateArgs} args - Arguments to create a ServerStat.
   * @example
   * // Create one ServerStat
   * const user = await prisma.serverStat.create({
   *   data: {
   *     // ... data to create a ServerStat
   *   }
   * })
   * 
  **/
  create<T extends ServerStatCreateArgs>(
    args: Subset<T, ServerStatCreateArgs>
  ): CheckSelect<T, ServerStatClient<ServerStat>, ServerStatClient<ServerStatGetPayload<T>>>
  /**
   * Delete a ServerStat.
   * @param {ServerStatDeleteArgs} args - Arguments to delete one ServerStat.
   * @example
   * // Delete one ServerStat
   * const user = await prisma.serverStat.delete({
   *   where: {
   *     // ... filter to delete one ServerStat
   *   }
   * })
   * 
  **/
  delete<T extends ServerStatDeleteArgs>(
    args: Subset<T, ServerStatDeleteArgs>
  ): CheckSelect<T, ServerStatClient<ServerStat>, ServerStatClient<ServerStatGetPayload<T>>>
  /**
   * Update one ServerStat.
   * @param {ServerStatUpdateArgs} args - Arguments to update one ServerStat.
   * @example
   * // Update one ServerStat
   * const serverStat = await prisma.serverStat.update({
   *   where: {
   *     // ... provide filter here
   *   },
   *   data: {
   *     // ... provide data here
   *   }
   * })
   * 
  **/
  update<T extends ServerStatUpdateArgs>(
    args: Subset<T, ServerStatUpdateArgs>
  ): CheckSelect<T, ServerStatClient<ServerStat>, ServerStatClient<ServerStatGetPayload<T>>>
  /**
   * Delete zero or more ServerStats.
   * @param {ServerStatDeleteManyArgs} args - Arguments to filter ServerStats to delete.
   * @example
   * // Delete a few ServerStats
   * const { count } = await prisma.serverStat.deleteMany({
   *   where: {
   *     // ... provide filter here
   *   }
   * })
   * 
  **/
  deleteMany<T extends ServerStatDeleteManyArgs>(
    args: Subset<T, ServerStatDeleteManyArgs>
  ): Promise<BatchPayload>
  /**
   * Update zero or more ServerStats.
   * @param {ServerStatUpdateManyArgs} args - Arguments to update one or more rows.
   * @example
   * // Update many ServerStats
   * const serverStat = await prisma.serverStat.updateMany({
   *   where: {
   *     // ... provide filter here
   *   },
   *   data: {
   *     // ... provide data here
   *   }
   * })
   * 
  **/
  updateMany<T extends ServerStatUpdateManyArgs>(
    args: Subset<T, ServerStatUpdateManyArgs>
  ): Promise<BatchPayload>
  /**
   * Create or update one ServerStat.
   * @param {ServerStatUpsertArgs} args - Arguments to update or create a ServerStat.
   * @example
   * // Update or create a ServerStat
   * const serverStat = await prisma.serverStat.upsert({
   *   create: {
   *     // ... data to create a ServerStat
   *   },
   *   update: {
   *     // ... in case it already exists, update
   *   },
   *   where: {
   *     // ... the filter for the ServerStat we want to update
   *   }
   * })
  **/
  upsert<T extends ServerStatUpsertArgs>(
    args: Subset<T, ServerStatUpsertArgs>
  ): CheckSelect<T, ServerStatClient<ServerStat>, ServerStatClient<ServerStatGetPayload<T>>>
  /**
   * 
   */
  count(args?: Omit<FindManyServerStatArgs, 'select' | 'include'>): Promise<number>
}

export declare class ServerStatClient<T> implements Promise<T> {
  private readonly _dmmf;
  private readonly _fetcher;
  private readonly _queryType;
  private readonly _rootField;
  private readonly _clientMethod;
  private readonly _args;
  private readonly _dataPath;
  private readonly _errorFormat;
  private readonly _measurePerformance?;
  private _isList;
  private _callsite;
  private _requestPromise?;
  private _collectTimestamps?;
  constructor(_dmmf: DMMFClass, _fetcher: PrismaClientFetcher, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);
  readonly [Symbol.toStringTag]: 'PrismaClientPromise';

  server<T extends ServerArgs = {}>(args?: Subset<T, ServerArgs>): CheckSelect<T, ServerClient<Server | null>, ServerClient<ServerGetPayload<T> | null>>;

  private get _document();
  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | Promise<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | Promise<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
  /**
   * Attaches a callback for only the rejection of the Promise.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never>(onrejected?: ((reason: any) => TResult | Promise<TResult>) | undefined | null): Promise<T | TResult>;
  /**
   * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
   * resolved value cannot be modified from the callback.
   * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
   * @returns A Promise for the completion of the callback.
   */
  finally(onfinally?: (() => void) | undefined | null): Promise<T>;
}

// Custom InputTypes

/**
 * ServerStat findOne
 */
export type FindOneServerStatArgs = {
  /**
   * Select specific fields to fetch from the ServerStat
  **/
  select?: ServerStatSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: ServerStatInclude | null
  /**
   * Filter, which ServerStat to fetch.
  **/
  where: ServerStatWhereUniqueInput
}


/**
 * ServerStat findMany
 */
export type FindManyServerStatArgs = {
  /**
   * Select specific fields to fetch from the ServerStat
  **/
  select?: ServerStatSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: ServerStatInclude | null
  /**
   * Filter, which ServerStats to fetch.
  **/
  where?: ServerStatWhereInput | null
  /**
   * Determine the order of the ServerStats to fetch.
  **/
  orderBy?: ServerStatOrderByInput | null
  /**
   * Skip the first `n` ServerStats.
  **/
  skip?: number | null
  /**
   * Get all ServerStats that come after the ServerStat you provide with the current order.
  **/
  after?: ServerStatWhereUniqueInput | null
  /**
   * Get all ServerStats that come before the ServerStat you provide with the current order.
  **/
  before?: ServerStatWhereUniqueInput | null
  /**
   * Get the first `n` ServerStats.
  **/
  first?: number | null
  /**
   * Get the last `n` ServerStats.
  **/
  last?: number | null
}


/**
 * ServerStat create
 */
export type ServerStatCreateArgs = {
  /**
   * Select specific fields to fetch from the ServerStat
  **/
  select?: ServerStatSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: ServerStatInclude | null
  /**
   * The data needed to create a ServerStat.
  **/
  data: ServerStatCreateInput
}


/**
 * ServerStat update
 */
export type ServerStatUpdateArgs = {
  /**
   * Select specific fields to fetch from the ServerStat
  **/
  select?: ServerStatSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: ServerStatInclude | null
  /**
   * The data needed to update a ServerStat.
  **/
  data: ServerStatUpdateInput
  /**
   * Choose, which ServerStat to update.
  **/
  where: ServerStatWhereUniqueInput
}


/**
 * ServerStat updateMany
 */
export type ServerStatUpdateManyArgs = {
  data: ServerStatUpdateManyMutationInput
  where?: ServerStatWhereInput | null
}


/**
 * ServerStat upsert
 */
export type ServerStatUpsertArgs = {
  /**
   * Select specific fields to fetch from the ServerStat
  **/
  select?: ServerStatSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: ServerStatInclude | null
  /**
   * The filter to search for the ServerStat to update in case it exists.
  **/
  where: ServerStatWhereUniqueInput
  /**
   * In case the ServerStat found by the `where` argument doesn't exist, create a new ServerStat with this data.
  **/
  create: ServerStatCreateInput
  /**
   * In case the ServerStat was found with the provided `where` argument, update it with this data.
  **/
  update: ServerStatUpdateInput
}


/**
 * ServerStat delete
 */
export type ServerStatDeleteArgs = {
  /**
   * Select specific fields to fetch from the ServerStat
  **/
  select?: ServerStatSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: ServerStatInclude | null
  /**
   * Filter which ServerStat to delete.
  **/
  where: ServerStatWhereUniqueInput
}


/**
 * ServerStat deleteMany
 */
export type ServerStatDeleteManyArgs = {
  where?: ServerStatWhereInput | null
}


/**
 * ServerStat without action
 */
export type ServerStatArgs = {
  /**
   * Select specific fields to fetch from the ServerStat
  **/
  select?: ServerStatSelect | null
  /**
   * Choose, which related nodes to fetch as well.
  **/
  include?: ServerStatInclude | null
}



/**
 * Deep Input Types
 */


export type ServerStatWhereInput = {
  id?: number | IntFilter | null
  createdAt?: Date | string | DateTimeFilter | null
  serverId?: number | IntFilter | null
  tickIndex?: number | IntFilter | null
  connections?: number | IntFilter | null
  users?: number | IntFilter | null
  spectators?: number | IntFilter | null
  entities?: number | IntFilter | null
  messages?: number | IntFilter | null
  duration?: number | IntFilter | null
  bytesSent?: number | IntFilter | null
  bytesReceived?: number | IntFilter | null
  totalBytesSent?: number | IntFilter | null
  totalBytesReceived?: number | IntFilter | null
  boardWidth?: number | IntFilter | null
  memHeapUsed?: number | IntFilter | null
  memHeapTotal?: number | IntFilter | null
  memExternal?: number | IntFilter | null
  entityGroupCount?: string | StringFilter | null
  AND?: Enumerable<ServerStatWhereInput> | null
  OR?: Enumerable<ServerStatWhereInput> | null
  NOT?: Enumerable<ServerStatWhereInput> | null
  server?: ServerWhereInput | null
}

export type ServerWhereInput = {
  id?: number | IntFilter | null
  createdAt?: Date | string | DateTimeFilter | null
  updatedAt?: Date | string | DateTimeFilter | null
  serverUrl?: string | StringFilter | null
  live?: boolean | BooleanFilter | null
  globalLeaderboardEntry?: GlobalLeaderboardEntryFilter | null
  serverStat?: ServerStatFilter | null
  AND?: Enumerable<ServerWhereInput> | null
  OR?: Enumerable<ServerWhereInput> | null
  NOT?: Enumerable<ServerWhereInput> | null
}

export type GlobalLeaderboardEntryWhereInput = {
  id?: number | IntFilter | null
  createdAt?: Date | string | DateTimeFilter | null
  updatedAt?: Date | string | DateTimeFilter | null
  score?: number | IntFilter | null
  sessionId?: string | StringFilter | null
  userId?: number | IntFilter | null
  serverId?: number | IntFilter | null
  aliveTime?: number | IntFilter | null
  damageGiven?: number | IntFilter | null
  damageTaken?: number | IntFilter | null
  enemiesKilled?: number | IntFilter | null
  eventsParticipatedIn?: number | IntFilter | null
  shotsFired?: number | IntFilter | null
  AND?: Enumerable<GlobalLeaderboardEntryWhereInput> | null
  OR?: Enumerable<GlobalLeaderboardEntryWhereInput> | null
  NOT?: Enumerable<GlobalLeaderboardEntryWhereInput> | null
  user?: UserWhereInput | null
  server?: ServerWhereInput | null
}

export type UserWhereInput = {
  id?: number | IntFilter | null
  createdAt?: Date | string | DateTimeFilter | null
  anonymous?: boolean | BooleanFilter | null
  username?: string | StringFilter | null
  passwordHash?: string | NullableStringFilter | null
  globalLeaderboardEntry?: GlobalLeaderboardEntryFilter | null
  AND?: Enumerable<UserWhereInput> | null
  OR?: Enumerable<UserWhereInput> | null
  NOT?: Enumerable<UserWhereInput> | null
}

export type UserWhereUniqueInput = {
  id?: number | null
  username?: string | null
}

export type GlobalLeaderboardEntryWhereUniqueInput = {
  id?: number | null
  sessionId?: string | null
}

export type ServerStatWhereUniqueInput = {
  id?: number | null
}

export type ServerWhereUniqueInput = {
  id?: number | null
}

export type ServerStatCreateWithoutServerInput = {
  createdAt?: Date | string | null
  tickIndex: number
  connections: number
  users: number
  spectators: number
  entities: number
  messages: number
  duration: number
  bytesSent: number
  bytesReceived: number
  totalBytesSent: number
  totalBytesReceived: number
  boardWidth: number
  memHeapUsed: number
  memHeapTotal: number
  memExternal: number
  entityGroupCount: string
}

export type ServerStatCreateManyWithoutServerInput = {
  create?: Enumerable<ServerStatCreateWithoutServerInput> | null
  connect?: Enumerable<ServerStatWhereUniqueInput> | null
}

export type ServerCreateWithoutGlobalLeaderboardEntryInput = {
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  serverUrl: string
  live: boolean
  serverStat?: ServerStatCreateManyWithoutServerInput | null
}

export type ServerCreateOneWithoutGlobalLeaderboardEntryInput = {
  create?: ServerCreateWithoutGlobalLeaderboardEntryInput | null
  connect?: ServerWhereUniqueInput | null
}

export type GlobalLeaderboardEntryCreateWithoutUserInput = {
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  score: number
  sessionId: string
  aliveTime: number
  damageGiven: number
  damageTaken: number
  enemiesKilled: number
  eventsParticipatedIn: number
  shotsFired: number
  server: ServerCreateOneWithoutGlobalLeaderboardEntryInput
}

export type GlobalLeaderboardEntryCreateManyWithoutUserInput = {
  create?: Enumerable<GlobalLeaderboardEntryCreateWithoutUserInput> | null
  connect?: Enumerable<GlobalLeaderboardEntryWhereUniqueInput> | null
}

export type UserCreateInput = {
  createdAt?: Date | string | null
  anonymous: boolean
  username: string
  passwordHash?: string | null
  globalLeaderboardEntry?: GlobalLeaderboardEntryCreateManyWithoutUserInput | null
}

export type ServerStatUpdateWithoutServerDataInput = {
  id?: number | null
  createdAt?: Date | string | null
  tickIndex?: number | null
  connections?: number | null
  users?: number | null
  spectators?: number | null
  entities?: number | null
  messages?: number | null
  duration?: number | null
  bytesSent?: number | null
  bytesReceived?: number | null
  totalBytesSent?: number | null
  totalBytesReceived?: number | null
  boardWidth?: number | null
  memHeapUsed?: number | null
  memHeapTotal?: number | null
  memExternal?: number | null
  entityGroupCount?: string | null
}

export type ServerStatUpdateWithWhereUniqueWithoutServerInput = {
  where: ServerStatWhereUniqueInput
  data: ServerStatUpdateWithoutServerDataInput
}

export type ServerStatScalarWhereInput = {
  id?: number | IntFilter | null
  createdAt?: Date | string | DateTimeFilter | null
  serverId?: number | IntFilter | null
  tickIndex?: number | IntFilter | null
  connections?: number | IntFilter | null
  users?: number | IntFilter | null
  spectators?: number | IntFilter | null
  entities?: number | IntFilter | null
  messages?: number | IntFilter | null
  duration?: number | IntFilter | null
  bytesSent?: number | IntFilter | null
  bytesReceived?: number | IntFilter | null
  totalBytesSent?: number | IntFilter | null
  totalBytesReceived?: number | IntFilter | null
  boardWidth?: number | IntFilter | null
  memHeapUsed?: number | IntFilter | null
  memHeapTotal?: number | IntFilter | null
  memExternal?: number | IntFilter | null
  entityGroupCount?: string | StringFilter | null
  AND?: Enumerable<ServerStatScalarWhereInput> | null
  OR?: Enumerable<ServerStatScalarWhereInput> | null
  NOT?: Enumerable<ServerStatScalarWhereInput> | null
}

export type ServerStatUpdateManyDataInput = {
  id?: number | null
  createdAt?: Date | string | null
  tickIndex?: number | null
  connections?: number | null
  users?: number | null
  spectators?: number | null
  entities?: number | null
  messages?: number | null
  duration?: number | null
  bytesSent?: number | null
  bytesReceived?: number | null
  totalBytesSent?: number | null
  totalBytesReceived?: number | null
  boardWidth?: number | null
  memHeapUsed?: number | null
  memHeapTotal?: number | null
  memExternal?: number | null
  entityGroupCount?: string | null
}

export type ServerStatUpdateManyWithWhereNestedInput = {
  where: ServerStatScalarWhereInput
  data: ServerStatUpdateManyDataInput
}

export type ServerStatUpsertWithWhereUniqueWithoutServerInput = {
  where: ServerStatWhereUniqueInput
  update: ServerStatUpdateWithoutServerDataInput
  create: ServerStatCreateWithoutServerInput
}

export type ServerStatUpdateManyWithoutServerInput = {
  create?: Enumerable<ServerStatCreateWithoutServerInput> | null
  connect?: Enumerable<ServerStatWhereUniqueInput> | null
  set?: Enumerable<ServerStatWhereUniqueInput> | null
  disconnect?: Enumerable<ServerStatWhereUniqueInput> | null
  delete?: Enumerable<ServerStatWhereUniqueInput> | null
  update?: Enumerable<ServerStatUpdateWithWhereUniqueWithoutServerInput> | null
  updateMany?: Enumerable<ServerStatUpdateManyWithWhereNestedInput> | null
  deleteMany?: Enumerable<ServerStatScalarWhereInput> | null
  upsert?: Enumerable<ServerStatUpsertWithWhereUniqueWithoutServerInput> | null
}

export type ServerUpdateWithoutGlobalLeaderboardEntryDataInput = {
  id?: number | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  serverUrl?: string | null
  live?: boolean | null
  serverStat?: ServerStatUpdateManyWithoutServerInput | null
}

export type ServerUpsertWithoutGlobalLeaderboardEntryInput = {
  update: ServerUpdateWithoutGlobalLeaderboardEntryDataInput
  create: ServerCreateWithoutGlobalLeaderboardEntryInput
}

export type ServerUpdateOneRequiredWithoutGlobalLeaderboardEntryInput = {
  create?: ServerCreateWithoutGlobalLeaderboardEntryInput | null
  connect?: ServerWhereUniqueInput | null
  update?: ServerUpdateWithoutGlobalLeaderboardEntryDataInput | null
  upsert?: ServerUpsertWithoutGlobalLeaderboardEntryInput | null
}

export type GlobalLeaderboardEntryUpdateWithoutUserDataInput = {
  id?: number | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  score?: number | null
  sessionId?: string | null
  aliveTime?: number | null
  damageGiven?: number | null
  damageTaken?: number | null
  enemiesKilled?: number | null
  eventsParticipatedIn?: number | null
  shotsFired?: number | null
  server?: ServerUpdateOneRequiredWithoutGlobalLeaderboardEntryInput | null
}

export type GlobalLeaderboardEntryUpdateWithWhereUniqueWithoutUserInput = {
  where: GlobalLeaderboardEntryWhereUniqueInput
  data: GlobalLeaderboardEntryUpdateWithoutUserDataInput
}

export type GlobalLeaderboardEntryScalarWhereInput = {
  id?: number | IntFilter | null
  createdAt?: Date | string | DateTimeFilter | null
  updatedAt?: Date | string | DateTimeFilter | null
  score?: number | IntFilter | null
  sessionId?: string | StringFilter | null
  userId?: number | IntFilter | null
  serverId?: number | IntFilter | null
  aliveTime?: number | IntFilter | null
  damageGiven?: number | IntFilter | null
  damageTaken?: number | IntFilter | null
  enemiesKilled?: number | IntFilter | null
  eventsParticipatedIn?: number | IntFilter | null
  shotsFired?: number | IntFilter | null
  AND?: Enumerable<GlobalLeaderboardEntryScalarWhereInput> | null
  OR?: Enumerable<GlobalLeaderboardEntryScalarWhereInput> | null
  NOT?: Enumerable<GlobalLeaderboardEntryScalarWhereInput> | null
}

export type GlobalLeaderboardEntryUpdateManyDataInput = {
  id?: number | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  score?: number | null
  sessionId?: string | null
  aliveTime?: number | null
  damageGiven?: number | null
  damageTaken?: number | null
  enemiesKilled?: number | null
  eventsParticipatedIn?: number | null
  shotsFired?: number | null
}

export type GlobalLeaderboardEntryUpdateManyWithWhereNestedInput = {
  where: GlobalLeaderboardEntryScalarWhereInput
  data: GlobalLeaderboardEntryUpdateManyDataInput
}

export type GlobalLeaderboardEntryUpsertWithWhereUniqueWithoutUserInput = {
  where: GlobalLeaderboardEntryWhereUniqueInput
  update: GlobalLeaderboardEntryUpdateWithoutUserDataInput
  create: GlobalLeaderboardEntryCreateWithoutUserInput
}

export type GlobalLeaderboardEntryUpdateManyWithoutUserInput = {
  create?: Enumerable<GlobalLeaderboardEntryCreateWithoutUserInput> | null
  connect?: Enumerable<GlobalLeaderboardEntryWhereUniqueInput> | null
  set?: Enumerable<GlobalLeaderboardEntryWhereUniqueInput> | null
  disconnect?: Enumerable<GlobalLeaderboardEntryWhereUniqueInput> | null
  delete?: Enumerable<GlobalLeaderboardEntryWhereUniqueInput> | null
  update?: Enumerable<GlobalLeaderboardEntryUpdateWithWhereUniqueWithoutUserInput> | null
  updateMany?: Enumerable<GlobalLeaderboardEntryUpdateManyWithWhereNestedInput> | null
  deleteMany?: Enumerable<GlobalLeaderboardEntryScalarWhereInput> | null
  upsert?: Enumerable<GlobalLeaderboardEntryUpsertWithWhereUniqueWithoutUserInput> | null
}

export type UserUpdateInput = {
  id?: number | null
  createdAt?: Date | string | null
  anonymous?: boolean | null
  username?: string | null
  passwordHash?: string | null
  globalLeaderboardEntry?: GlobalLeaderboardEntryUpdateManyWithoutUserInput | null
}

export type UserUpdateManyMutationInput = {
  id?: number | null
  createdAt?: Date | string | null
  anonymous?: boolean | null
  username?: string | null
  passwordHash?: string | null
}

export type UserCreateWithoutGlobalLeaderboardEntryInput = {
  createdAt?: Date | string | null
  anonymous: boolean
  username: string
  passwordHash?: string | null
}

export type UserCreateOneWithoutGlobalLeaderboardEntryInput = {
  create?: UserCreateWithoutGlobalLeaderboardEntryInput | null
  connect?: UserWhereUniqueInput | null
}

export type GlobalLeaderboardEntryCreateInput = {
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  score: number
  sessionId: string
  aliveTime: number
  damageGiven: number
  damageTaken: number
  enemiesKilled: number
  eventsParticipatedIn: number
  shotsFired: number
  user: UserCreateOneWithoutGlobalLeaderboardEntryInput
  server: ServerCreateOneWithoutGlobalLeaderboardEntryInput
}

export type UserUpdateWithoutGlobalLeaderboardEntryDataInput = {
  id?: number | null
  createdAt?: Date | string | null
  anonymous?: boolean | null
  username?: string | null
  passwordHash?: string | null
}

export type UserUpsertWithoutGlobalLeaderboardEntryInput = {
  update: UserUpdateWithoutGlobalLeaderboardEntryDataInput
  create: UserCreateWithoutGlobalLeaderboardEntryInput
}

export type UserUpdateOneRequiredWithoutGlobalLeaderboardEntryInput = {
  create?: UserCreateWithoutGlobalLeaderboardEntryInput | null
  connect?: UserWhereUniqueInput | null
  update?: UserUpdateWithoutGlobalLeaderboardEntryDataInput | null
  upsert?: UserUpsertWithoutGlobalLeaderboardEntryInput | null
}

export type GlobalLeaderboardEntryUpdateInput = {
  id?: number | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  score?: number | null
  sessionId?: string | null
  aliveTime?: number | null
  damageGiven?: number | null
  damageTaken?: number | null
  enemiesKilled?: number | null
  eventsParticipatedIn?: number | null
  shotsFired?: number | null
  user?: UserUpdateOneRequiredWithoutGlobalLeaderboardEntryInput | null
  server?: ServerUpdateOneRequiredWithoutGlobalLeaderboardEntryInput | null
}

export type GlobalLeaderboardEntryUpdateManyMutationInput = {
  id?: number | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  score?: number | null
  sessionId?: string | null
  aliveTime?: number | null
  damageGiven?: number | null
  damageTaken?: number | null
  enemiesKilled?: number | null
  eventsParticipatedIn?: number | null
  shotsFired?: number | null
}

export type GlobalLeaderboardEntryCreateWithoutServerInput = {
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  score: number
  sessionId: string
  aliveTime: number
  damageGiven: number
  damageTaken: number
  enemiesKilled: number
  eventsParticipatedIn: number
  shotsFired: number
  user: UserCreateOneWithoutGlobalLeaderboardEntryInput
}

export type GlobalLeaderboardEntryCreateManyWithoutServerInput = {
  create?: Enumerable<GlobalLeaderboardEntryCreateWithoutServerInput> | null
  connect?: Enumerable<GlobalLeaderboardEntryWhereUniqueInput> | null
}

export type ServerCreateInput = {
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  serverUrl: string
  live: boolean
  globalLeaderboardEntry?: GlobalLeaderboardEntryCreateManyWithoutServerInput | null
  serverStat?: ServerStatCreateManyWithoutServerInput | null
}

export type GlobalLeaderboardEntryUpdateWithoutServerDataInput = {
  id?: number | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  score?: number | null
  sessionId?: string | null
  aliveTime?: number | null
  damageGiven?: number | null
  damageTaken?: number | null
  enemiesKilled?: number | null
  eventsParticipatedIn?: number | null
  shotsFired?: number | null
  user?: UserUpdateOneRequiredWithoutGlobalLeaderboardEntryInput | null
}

export type GlobalLeaderboardEntryUpdateWithWhereUniqueWithoutServerInput = {
  where: GlobalLeaderboardEntryWhereUniqueInput
  data: GlobalLeaderboardEntryUpdateWithoutServerDataInput
}

export type GlobalLeaderboardEntryUpsertWithWhereUniqueWithoutServerInput = {
  where: GlobalLeaderboardEntryWhereUniqueInput
  update: GlobalLeaderboardEntryUpdateWithoutServerDataInput
  create: GlobalLeaderboardEntryCreateWithoutServerInput
}

export type GlobalLeaderboardEntryUpdateManyWithoutServerInput = {
  create?: Enumerable<GlobalLeaderboardEntryCreateWithoutServerInput> | null
  connect?: Enumerable<GlobalLeaderboardEntryWhereUniqueInput> | null
  set?: Enumerable<GlobalLeaderboardEntryWhereUniqueInput> | null
  disconnect?: Enumerable<GlobalLeaderboardEntryWhereUniqueInput> | null
  delete?: Enumerable<GlobalLeaderboardEntryWhereUniqueInput> | null
  update?: Enumerable<GlobalLeaderboardEntryUpdateWithWhereUniqueWithoutServerInput> | null
  updateMany?: Enumerable<GlobalLeaderboardEntryUpdateManyWithWhereNestedInput> | null
  deleteMany?: Enumerable<GlobalLeaderboardEntryScalarWhereInput> | null
  upsert?: Enumerable<GlobalLeaderboardEntryUpsertWithWhereUniqueWithoutServerInput> | null
}

export type ServerUpdateInput = {
  id?: number | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  serverUrl?: string | null
  live?: boolean | null
  globalLeaderboardEntry?: GlobalLeaderboardEntryUpdateManyWithoutServerInput | null
  serverStat?: ServerStatUpdateManyWithoutServerInput | null
}

export type ServerUpdateManyMutationInput = {
  id?: number | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  serverUrl?: string | null
  live?: boolean | null
}

export type ServerCreateWithoutServerStatInput = {
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  serverUrl: string
  live: boolean
  globalLeaderboardEntry?: GlobalLeaderboardEntryCreateManyWithoutServerInput | null
}

export type ServerCreateOneWithoutServerStatInput = {
  create?: ServerCreateWithoutServerStatInput | null
  connect?: ServerWhereUniqueInput | null
}

export type ServerStatCreateInput = {
  createdAt?: Date | string | null
  tickIndex: number
  connections: number
  users: number
  spectators: number
  entities: number
  messages: number
  duration: number
  bytesSent: number
  bytesReceived: number
  totalBytesSent: number
  totalBytesReceived: number
  boardWidth: number
  memHeapUsed: number
  memHeapTotal: number
  memExternal: number
  entityGroupCount: string
  server: ServerCreateOneWithoutServerStatInput
}

export type ServerUpdateWithoutServerStatDataInput = {
  id?: number | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  serverUrl?: string | null
  live?: boolean | null
  globalLeaderboardEntry?: GlobalLeaderboardEntryUpdateManyWithoutServerInput | null
}

export type ServerUpsertWithoutServerStatInput = {
  update: ServerUpdateWithoutServerStatDataInput
  create: ServerCreateWithoutServerStatInput
}

export type ServerUpdateOneRequiredWithoutServerStatInput = {
  create?: ServerCreateWithoutServerStatInput | null
  connect?: ServerWhereUniqueInput | null
  update?: ServerUpdateWithoutServerStatDataInput | null
  upsert?: ServerUpsertWithoutServerStatInput | null
}

export type ServerStatUpdateInput = {
  id?: number | null
  createdAt?: Date | string | null
  tickIndex?: number | null
  connections?: number | null
  users?: number | null
  spectators?: number | null
  entities?: number | null
  messages?: number | null
  duration?: number | null
  bytesSent?: number | null
  bytesReceived?: number | null
  totalBytesSent?: number | null
  totalBytesReceived?: number | null
  boardWidth?: number | null
  memHeapUsed?: number | null
  memHeapTotal?: number | null
  memExternal?: number | null
  entityGroupCount?: string | null
  server?: ServerUpdateOneRequiredWithoutServerStatInput | null
}

export type ServerStatUpdateManyMutationInput = {
  id?: number | null
  createdAt?: Date | string | null
  tickIndex?: number | null
  connections?: number | null
  users?: number | null
  spectators?: number | null
  entities?: number | null
  messages?: number | null
  duration?: number | null
  bytesSent?: number | null
  bytesReceived?: number | null
  totalBytesSent?: number | null
  totalBytesReceived?: number | null
  boardWidth?: number | null
  memHeapUsed?: number | null
  memHeapTotal?: number | null
  memExternal?: number | null
  entityGroupCount?: string | null
}

export type IntFilter = {
  equals?: number | null
  not?: number | IntFilter | null
  in?: Enumerable<number> | null
  notIn?: Enumerable<number> | null
  lt?: number | null
  lte?: number | null
  gt?: number | null
  gte?: number | null
}

export type DateTimeFilter = {
  equals?: Date | string | null
  not?: Date | string | DateTimeFilter | null
  in?: Enumerable<Date | string> | null
  notIn?: Enumerable<Date | string> | null
  lt?: Date | string | null
  lte?: Date | string | null
  gt?: Date | string | null
  gte?: Date | string | null
}

export type StringFilter = {
  equals?: string | null
  not?: string | StringFilter | null
  in?: Enumerable<string> | null
  notIn?: Enumerable<string> | null
  lt?: string | null
  lte?: string | null
  gt?: string | null
  gte?: string | null
  contains?: string | null
  startsWith?: string | null
  endsWith?: string | null
}

export type BooleanFilter = {
  equals?: boolean | null
  not?: boolean | BooleanFilter | null
}

export type GlobalLeaderboardEntryFilter = {
  every?: GlobalLeaderboardEntryWhereInput | null
  some?: GlobalLeaderboardEntryWhereInput | null
  none?: GlobalLeaderboardEntryWhereInput | null
}

export type ServerStatFilter = {
  every?: ServerStatWhereInput | null
  some?: ServerStatWhereInput | null
  none?: ServerStatWhereInput | null
}

export type NullableStringFilter = {
  equals?: string | null
  not?: string | null | NullableStringFilter
  in?: Enumerable<string> | null
  notIn?: Enumerable<string> | null
  lt?: string | null
  lte?: string | null
  gt?: string | null
  gte?: string | null
  contains?: string | null
  startsWith?: string | null
  endsWith?: string | null
}

export type UserOrderByInput = {
  id?: OrderByArg | null
  createdAt?: OrderByArg | null
  anonymous?: OrderByArg | null
  username?: OrderByArg | null
  passwordHash?: OrderByArg | null
}

export type GlobalLeaderboardEntryOrderByInput = {
  id?: OrderByArg | null
  createdAt?: OrderByArg | null
  updatedAt?: OrderByArg | null
  score?: OrderByArg | null
  sessionId?: OrderByArg | null
  userId?: OrderByArg | null
  serverId?: OrderByArg | null
  aliveTime?: OrderByArg | null
  damageGiven?: OrderByArg | null
  damageTaken?: OrderByArg | null
  enemiesKilled?: OrderByArg | null
  eventsParticipatedIn?: OrderByArg | null
  shotsFired?: OrderByArg | null
}

export type ServerStatOrderByInput = {
  id?: OrderByArg | null
  createdAt?: OrderByArg | null
  serverId?: OrderByArg | null
  tickIndex?: OrderByArg | null
  connections?: OrderByArg | null
  users?: OrderByArg | null
  spectators?: OrderByArg | null
  entities?: OrderByArg | null
  messages?: OrderByArg | null
  duration?: OrderByArg | null
  bytesSent?: OrderByArg | null
  bytesReceived?: OrderByArg | null
  totalBytesSent?: OrderByArg | null
  totalBytesReceived?: OrderByArg | null
  boardWidth?: OrderByArg | null
  memHeapUsed?: OrderByArg | null
  memHeapTotal?: OrderByArg | null
  memExternal?: OrderByArg | null
  entityGroupCount?: OrderByArg | null
}

export type ServerOrderByInput = {
  id?: OrderByArg | null
  createdAt?: OrderByArg | null
  updatedAt?: OrderByArg | null
  serverUrl?: OrderByArg | null
  live?: OrderByArg | null
}

/**
 * Batch Payload for updateMany & deleteMany
 */

export type BatchPayload = {
  count: number
}

/**
 * DMMF
 */
export declare const dmmf: DMMF.Document;
export {};
