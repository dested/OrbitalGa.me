type BSONTypeAlias =
  | 'number'
  | 'double'
  | 'string'
  | 'object'
  | 'array'
  | 'binData'
  | 'undefined'
  | 'objectId'
  | 'bool'
  | 'date'
  | 'null'
  | 'regex'
  | 'dbPointer'
  | 'javascript'
  | 'symbol'
  | 'javascriptWithScope'
  | 'int'
  | 'timestamp'
  | 'long'
  | 'decimal'
  | 'minKey'
  | 'maxKey';

// we can search using alternative types in mongodb e.g.
// string types can be searched using a regex in mongo
// array types can be searched using their element type
type RegExpForString<T> = T extends string ? RegExp | T : T;
export type MongoAltQuery<T> = T extends Array<infer U> ? T | RegExpForString<U> : RegExpForString<T>;

/** https://docs.mongodb.com/manual/reference/operator/query/#query-selectors */
export type QuerySelector<T> = {
  // Comparison
  $eq?: T;
  $gt?: T;
  $gte?: T;
  $in?: T[];
  $lt?: T;
  $lte?: T;
  $ne?: T;
  $nin?: T[];
  // Logical
  $not?: T extends string ? QuerySelector<T> | RegExp : QuerySelector<T>;
  // Element
  /**
   * When `true`, `$exists` matches the documents that contain the field,
   * including documents where the field value is null.
   */
  $exists?: boolean;
  $mod?: T extends number ? [number, number] : never;
  $regex?: T extends string ? RegExp | string : never;
  $options?: T extends string ? string : never;
  // Geospatial
  // TODO: define better types for geo queries
  $geoIntersects?: {$geometry: never /*todo fix*/};
  $geoWithin?: never /*todo fix*/;
  $near?: never /*todo fix*/;
  $nearSphere?: never /*todo fix*/;
  $maxDistance?: number;
  // Array
  // TODO: define better types for $all and $elemMatch
  $all?: T extends Array<infer U> ? FilterQuery2<U>[] : never;
  $elemMatch?: T extends Array<infer U> ? FilterQuery2<U> : never;
  $size?: T extends Array<infer U> ? number : never;
  // Bitwise
};

export type RootQuerySelector<T> = {
  /** https://docs.mongodb.com/manual/reference/operator/query/and/#op._S_and */
  $and?: Array<FilterQuery2<T>>;
  /** https://docs.mongodb.com/manual/reference/operator/query/nor/#op._S_nor */
  $nor?: Array<FilterQuery2<T>>;
  /** https://docs.mongodb.com/manual/reference/operator/query/or/#op._S_or */
  $or?: Array<FilterQuery2<T>>;
  /** https://docs.mongodb.com/manual/reference/operator/query/text */
  $text?: {
    $search: string;
    $language?: string;
    $caseSensitive?: boolean;
    $diacraticSensitive?: boolean;
  };
  /** https://docs.mongodb.com/manual/reference/operator/query/comment/#op._S_comment */
  $comment?: string;
  // we could not find a proper TypeScript generic to support nested queries e.g. 'user.friends.name'
  // this will mark all unrecognized properties as any (including nested queries)
};

export type FilterQuery2<T> = {
  [P in keyof T]?: MongoAltQuery<T[P]> | QuerySelector<MongoAltQuery<T[P]>>;
} &
  RootQuerySelector<T>;

export type UpdateQuery2<T> = {
  $inc?: {[P in keyof T]?: number} | {[key: string]: number};
  $min?: {[P in keyof T]?: number} | {[key: string]: number};
  $max?: {[P in keyof T]?: number} | {[key: string]: number};
  $mul?: {[P in keyof T]?: number} | {[key: string]: number};
  $set?: Partial<T>;
  $setOnInsert?: Partial<T> | {[key: string]: any};
  $unset?: {[P in keyof T]?: ''} | {[key: string]: ''};
  $rename?: {[key: string]: keyof T} | {[key: string]: string};
  $currentDate?:
    | {[P in keyof T]?: true | {$type: 'date' | 'timestamp'}}
    | {[key: string]: true | {$type: 'date' | 'timestamp'}};
  $addToSet?: {[P in keyof T]?: any} | {[key: string]: any};
  $pop?: {[P in keyof T]?: -1 | 1} | {[key: string]: -1 | 1};
  $pull?: FilterQuery2<T>;
  $push?: Partial<T> | {[key: string]: any};
  $pushAll?: Partial<T> | {[key: string]: any[]};
  $each?: Partial<T> | {[key: string]: any[]};
  $bit?: {[P in keyof T]?: any} | {[key: string]: any};
};
