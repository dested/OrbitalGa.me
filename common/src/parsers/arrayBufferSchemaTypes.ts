export type Discriminate<T, TField extends keyof T, TValue extends T[TField]> = T extends {[field in TField]: TValue}
  ? T
  : never;
export type ABEnum<T extends string> = {[key in T]: number} & {flag: 'enum'};
export type ABBitmask<T> = {[keyT in keyof T]-?: number} & {flag: 'bitmask'};
export type ABArray<TElements> = {elements: TElements; flag: 'array-uint8' | 'array-uint16'};
export type ABTypeLookup<TElements> = {elements: TElements; flag: 'type-lookup'};
export type ABEntityTypeLookup<TElements> = {elements: TElements; flag: 'entity-type-lookup'};
export type AnyAndKey<TKey extends string, TValue> = {[key: string]: any} & {[key in TKey]: TValue};

export type ABScalars =
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'int8'
  | 'int16'
  | 'int32'
  | 'float32'
  | 'float64'
  | 'int8Optional'
  | 'int32Optional'
  | 'string'
  | 'boolean';

export type ABFlags =
  | {flag: 'enum'}
  | {flag: 'bitmask'}
  | {elements: any; flag: 'array-uint16'}
  | {elements: any; flag: 'array-uint8'}
  | {elements: {[key: string]: AnyAndKey<'type', number>}; flag: 'type-lookup'}
  | {elements: {[key: string]: AnyAndKey<'entityType', number>}; flag: 'entity-type-lookup'}
  | {flag: undefined};

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
type StringUnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I extends string
    ? I
    : never
  : never;

export type AB<T> = T extends string
  ? 'string'
  : T extends number
  ?
      | 'uint8'
      | 'uint16'
      | 'uint32'
      | 'int8'
      | 'int16'
      | 'int32'
      | 'float32'
      | 'float64'
      | 'int8Optional'
      | 'int32Optional'
  : T extends boolean
  ? 'boolean'
  : T extends Array<any>
  ? T[number] extends {entityType: string}
    ? ABArray<ABEntityTypeLookup<ABSizeKeys<T[number]>>>
    : T[number] extends {type: string}
    ? ABArray<ABTypeLookup<ABKeys<T[number]>>>
    : ABArray<ABObj<T[number]>>
  : T extends {[key in keyof T]: boolean}
  ? ABBitmask<T>
  : T extends {type: string}
  ? ABTypeLookup<ABKeys<T>>
  : T extends {entityType: string}
  ? ABEntityTypeLookup<ABSizeKeys<T>>
  : T extends {}
  ? ABObj<T>
  : never;

type IsUnion<T, U extends T = T> = T extends unknown ? ([U] extends [T] ? false : true) : false;
type IsStringUnion<T> = IsUnion<T> extends true ? (T extends string ? true : false) : false;

export type ABObj<TItem> = {
  [keyT in keyof TItem]: IsStringUnion<TItem[keyT]> extends true
    ? TItem[keyT] extends string
      ? ABEnum<TItem[keyT]>
      : never
    : AB<TItem[keyT]>;
};

export type ABByType<TItem extends {type: string}, TKey extends TItem['type']> = ABObj<
  Omit<Discriminate<TItem, 'type', TKey>, 'type'>
> & {type: number};

export type ABSizeByType<TItem extends {entityType: string}, TKey extends TItem['entityType']> = ABObj<
  Omit<Discriminate<TItem, 'entityType', TKey>, 'entityType'>
> & {entityType: number};

export type ABKeys<TItem extends {type: string}> = {
  [key in TItem['type']]: ABByType<TItem, key>;
};

export type ABSizeKeys<TItem extends {entityType: string}> = {
  [key in TItem['entityType']]: ABSizeByType<TItem, key>;
};
