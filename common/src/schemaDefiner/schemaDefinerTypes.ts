export type Discriminate<T, TField extends keyof T, TValue extends T[TField]> = T extends {[field in TField]: TValue}
  ? T
  : never;
export type SDEnum<T extends string> = {[key in T]: number} & {flag: 'enum'};
export type SDBitmask<T> = {[keyT in keyof T]-?: number} & {flag: 'bitmask'};
export type SDArray<TElements> = {elements: TElements; flag: 'array-uint8' | 'array-uint16'};
export type SDTypeLookupElements<TElements extends {type: string}> = {
  elements: {
    [key in TElements['type']]: SDTypeLookup<TElements, key>;
  };
  flag: 'type-lookup';
};
export type SDTypeLookup<TItem extends {type: string}, TKey extends TItem['type']> = SDSimpleObject<
  Omit<Discriminate<TItem, 'type', TKey>, 'type'>
> & {type: number};

export type SDSimpleObject<TItem> = {
  [keyT in keyof Required<TItem>]: SDElement<Required<TItem>, keyT>;
};

export type SDElement<T, TKey extends keyof T> = T[TKey] extends string
  ? 'string' | SDEnum<T[TKey]>
  : T[TKey] extends number
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
  : T[TKey] extends boolean
  ? 'boolean'
  : T[TKey] extends Array<any>
  ? T[TKey][number] extends {type: string}
    ? SDArray<SDTypeLookupElements<T[TKey][number]>>
    : SDArray<SDSimpleObject<T[TKey][number]>>
  : T[TKey] extends {[key in keyof T[TKey]]: boolean}
  ? SDBitmask<T[TKey]>
  : T[TKey] extends {type: string}
  ? SDTypeLookupElements<T[TKey]>
  : T[TKey] extends {}
  ? SDSimpleObject<T[TKey]>
  : never;

export type ABFlags =
  | {flag: 'enum'}
  | {flag: 'bitmask'}
  | {elements: any; flag: 'array-uint16'}
  | {elements: any; flag: 'array-uint8'}
  | {elements: {[key: string]: ABSchemaDef & {type: number}}; flag: 'type-lookup'}
  | {elements: {[key: string]: ABSchemaDef & {entityType: number}}; flag: 'entity-type-lookup'}
  | ({flag: undefined} & {[key: string]: any});
export type ABSchemaDef = ABFlags | string;
