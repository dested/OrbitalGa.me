import * as esprima from 'esprima';
import {
  ArrowFunctionExpression,
  ExpressionStatement,
  Identifier,
  Literal,
  MemberExpression,
  UnaryExpression,
} from 'estree';
import {AggregationCursor, Cursor, Db, IndexOptions, MongoClient, ObjectID} from 'mongodb';
import {Config} from '../config/config';
import {FilterQuery2, MongoAltQuery, QuerySelector, UpdateQuery2} from './typeSafeFilter';
import {ServerError} from '../apiUtils/errors';

let mongoClient: MongoClient | null;
let firstTime = true;

let retries = 0;
export class DataManager {
  static async disconnectDB() {
    try {
      if (mongoClient) {
        await mongoClient.close();
        mongoClient = null;
        firstTime = true;
      }
    } catch (ex) {
      console.error('disconnect db error', ex);
    }
  }
  static async dbConnection(): Promise<Db> {
    if (!mongoClient || !mongoClient.isConnected()) {
      if (!firstTime) {
        console.log('dbConnection hot but disconnected');
        await this.disconnectDB();
      } else {
        console.log('dbConnection cold');
        firstTime = false;
      }
      try {
        mongoClient =
          mongoClient ||
          new MongoClient(Config.dbConnection, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            loggerLevel: 'error',
            logger: (e, b) => console.log(b, e),
          });
        await mongoClient.connect();
        retries = 0;
      } catch (ex) {
        console.error('dbConnection error');
        console.error(ex);
        retries++;
        if (retries > 3) {
          throw new ServerError();
        }
        // await Utils.timeout(1000);
        return this.dbConnection();
      }
    } else {
      // console.log('db connection hot ');
    }
    const db = mongoClient.db(Config.dbName);
    // console.log('got db');
    return db;
  }
}

export class DocumentManager<T extends {_id: ObjectID}> {
  static functionToArrow(input: string) {
    const results = input.match(/function\s*\((\w),*(\s*\s*\w*)*\)\s*{\s*return\s+(.+);\s*}/);
    if (!results || results.length !== 4) {
      throw new Error(`Cannot convert function to arrow`);
    }
    if (results[2]) {
      return `(${results[1]},${results[2]})=>${results[3]}`;
    } else {
      return `(${results[1]})=>${results[3]}`;
    }
  }

  static flattenObject(member: MemberExpression | Identifier | UnaryExpression | Literal): string {
    switch (member.type) {
      case 'Identifier':
        return (member as Identifier).name;
      case 'Literal':
        throw new Error('Array indexing is not supported yet.');
      case 'UnaryExpression':
        if ((member as UnaryExpression).operator !== '-') {
          throw new Error('Array index can only be -1: ');
        }
        return '$ARRAY_QUERY$';
      case 'MemberExpression':
        const name = this.flattenObject((member as MemberExpression).object as MemberExpression);
        const identifier = this.flattenObject((member as MemberExpression).property as Identifier | Literal);
        if (identifier === '$ARRAY_QUERY$') {
          // for array indexer
          return name;
        }
        return `${name}.${identifier}`;
    }
    throw new Error('Object can only be of type Identifier or MemberExpression: ' + JSON.stringify(member));
  }

  keyFilter<T2>(query: (t: T) => T2, value: MongoAltQuery<T2> | QuerySelector<MongoAltQuery<T2>>): FilterQuery2<T> {
    let input = query.toString();
    if (input.indexOf('function') === 0) {
      input = DocumentManager.functionToArrow(input);
    }

    const parseResult = esprima.parseScript(input);

    const body = parseResult.body[0];
    if (body.type !== 'ExpressionStatement') {
      throw new Error('Body must be an expression');
    }

    const arrow = (body as ExpressionStatement).expression as ArrowFunctionExpression;
    if (arrow.type !== 'ArrowFunctionExpression') {
      throw new Error('Function must be an arrow function.');
    }

    const variableName = (arrow.params[0] as Identifier).name;
    const side = arrow.body;

    switch (side.type) {
      case 'Identifier':
      case 'MemberExpression':
        const name = DocumentManager.flattenObject(side as MemberExpression | Identifier);
        const nameWithoutInitial = name.split('.').slice(1).join('.');

        if (variableName !== name.split('.')[0]) {
          throw new Error('You can only reference the argument passed in');
        }

        return {[nameWithoutInitial]: value} as any;
      default:
        throw new Error('You can only supply an identifier');
    }
  }

  keySet<T2>(query: (t: T) => T2, value: MongoAltQuery<T2> | QuerySelector<MongoAltQuery<T2>>): Partial<T> {
    return this.keyFilter(query, value) as any;
  }

  keyProject<T2>(query: (t: T) => T2, value: 1 | -1): {[key in keyof T]?: 1 | -1} {
    return this.keyFilter(query, value as any) as any;
  }

  keyFilterArray<T2, T3>(
    query: (t: T) => T2[],
    arrayItem: (t: T2) => T3,
    value: MongoAltQuery<T3> | QuerySelector<MongoAltQuery<T3>>,
    positional: boolean
  ): FilterQuery2<T> {
    const key = this.keyFilter(query, null);
    const arrayKey = this.keyFilter(arrayItem as any, value);
    return {
      [Object.keys(key)[0] + (positional ? '.$' : '') + '.' + Object.keys(arrayKey)[0]]: value,
    } as any;
  }

  keyFilterArrayNumber<T2, T3>(
    query: (t: T) => T2[],
    arrayItem: number,
    value: MongoAltQuery<T3> | QuerySelector<MongoAltQuery<T3>>
  ): FilterQuery2<T> {
    const key = this.keyFilter(query, null);
    return {
      [Object.keys(key)[0] + '.' + arrayItem]: value,
    } as any;
  }

  constructor(private collectionName: string) {}

  async insertDocument(document: T): Promise<T> {
    const collection = await this.getCollection();
    console.log('insert started');
    const result = await collection.insertOne(document as any);
    console.log('insert done');
    document._id = result.insertedId;
    return document;
  }
  async updateOne(filter: FilterQuery2<T>, update: UpdateQuery2<T>): Promise<void> {
    await (await this.getCollection()).updateOne(filter, update as any);
  }

  async updateMany(filter: FilterQuery2<T>, update: UpdateQuery2<T>): Promise<void> {
    await (await this.getCollection()).updateMany(filter, update as any);
  }

  async getCollection() {
    // console.log('getting collection db');
    const db = await DataManager.dbConnection();
    // console.log('getting collection');
    const collection = db.collection<T>(this.collectionName);
    // console.log('got collection');
    return collection;
  }

  async insertDocuments(documents: T[]): Promise<T[]> {
    const result = await (await this.getCollection()).insertMany(documents as any);
    for (let i = 0; i < documents.length; i++) {
      documents[i]._id = result.insertedIds[i];
    }
    return documents;
  }

  async updateDocument(document: T): Promise<T> {
    const collection = await this.getCollection();

    await collection.findOneAndReplace({_id: document._id} as any, document);
    return document;
  }

  async getOne(query: FilterQuery2<T>, projection?: any): Promise<T | null> {
    if (projection) {
      return (await this.getCollection()).findOne(query, {projection});
    } else {
      return (await this.getCollection()).findOne(query);
    }
  }

  async aggregate<TResult>(pipeline: object[]): Promise<TResult[]> {
    return (await DataManager.dbConnection()).collection(this.collectionName).aggregate(pipeline).toArray();
  }

  async aggregateCursor<TResult>(pipeline: object[]): Promise<AggregationCursor<TResult>> {
    return (await DataManager.dbConnection()).collection(this.collectionName).aggregate(pipeline);
  }

  async getById(id: string | ObjectID, projection?: any): Promise<T | null> {
    const objectId: ObjectID = typeof id === 'string' ? ObjectID.createFromHexString(id) : id;
    if (projection) {
      return (await DataManager.dbConnection()).collection(this.collectionName).findOne({_id: objectId}, {projection});
    } else {
      return (await DataManager.dbConnection()).collection(this.collectionName).findOne({_id: objectId});
    }
  }

  async getByIdProject<
    TOverride extends DeepPartial<T> = DeepPartial<T>,
    TProjection extends {[key in keyof TOverride]?: 1 | -1} = {[key in keyof TOverride]?: 1 | -1},
    TKeys extends keyof TProjection & keyof TOverride = keyof T
  >(id: string | ObjectID, projection: TProjection): Promise<{[key in TKeys]: TOverride[key]}> {
    const objectId: ObjectID = typeof id === 'string' ? ObjectID.createFromHexString(id) : id;

    return (await (await DataManager.dbConnection())
      .collection(this.collectionName)
      .findOne({_id: objectId}, {projection})) as {
      [key in TKeys]: TOverride[key];
    };
  }

  async deleteMany(query: FilterQuery2<T>): Promise<void> {
    await (await this.getCollection()).deleteMany(query);
  }
  async deleteOne(query: FilterQuery2<T>): Promise<void> {
    await (await this.getCollection()).deleteOne(query);
  }

  async getAll(query: FilterQuery2<T>): Promise<T[]> {
    return (await (await this.getCollection()).find(query)).toArray();
  }

  async find(query: FilterQuery2<T>) {
    return (await this.getCollection()).find(query);
  }

  async getAllProject<
    TOverride extends DeepPartial<T> = DeepPartial<T>,
    TProjection extends {[key in keyof TOverride]?: 1 | -1} = {[key in keyof TOverride]?: 1 | -1},
    TKeys extends keyof TProjection & keyof TOverride = keyof T
  >(query: FilterQuery2<T>, projection: TProjection): Promise<{[key in TKeys]: TOverride[key]}[]> {
    return ((await (await this.getCollection()).find(query, {projection})).toArray() as unknown) as {
      [key in TKeys]: TOverride[key];
    }[];
  }

  async getOneProject<
    TOverride extends DeepPartial<T> = DeepPartial<T>,
    TProjection extends {[key in keyof TOverride]?: 1 | -1} = {[key in keyof TOverride]?: 1 | -1},
    TKeys extends keyof TProjection & keyof TOverride = keyof T
  >(query: FilterQuery2<T>, projection: TProjection): Promise<{[key in TKeys]: TOverride[key]}> {
    return ((await (await this.getCollection()).findOne(query, {projection})) as unknown) as {
      [key in TKeys]: TOverride[key];
    };
  }

  async findProject<
    TOverride extends DeepPartial<T> = DeepPartial<T>,
    TProjection extends {[key in keyof TOverride]?: 1 | -1} = {[key in keyof TOverride]?: 1 | -1},
    TKeys extends keyof TProjection & keyof TOverride = keyof T
  >(query: FilterQuery2<T>, projection: TProjection): Promise<Cursor<{[key in TKeys]: TOverride[key]}>> {
    return ((await (await this.getCollection()).find(query, {projection})) as unknown) as Cursor<
      {
        [key in TKeys]: TOverride[key];
      }
    >;
  }

  async exists(query: FilterQuery2<T>): Promise<boolean> {
    return (await (await this.getCollection()).count(query, {})) > 0;
  }

  async getAllPaged(
    query: FilterQuery2<T>,
    sortKey: keyof T | null,
    sortDirection: 1 | -1,
    page: number,
    take: number
  ): Promise<T[]> {
    let cursor = (await DataManager.dbConnection()).collection(this.collectionName).find(query);
    if (sortKey) {
      cursor = cursor.sort(sortKey as string, sortDirection);
    }
    return (await cursor.skip(page * take).limit(take)).toArray();
  }

  async getAllCursor(
    query: FilterQuery2<T>,
    sortKey: keyof T | null,
    sortDirection: number,
    page: number,
    take: number
  ): Promise<Cursor<T>> {
    let cursor = (await DataManager.dbConnection()).collection(this.collectionName).find(query);
    if (sortKey) {
      cursor = cursor.sort(sortKey as string, sortDirection);
    }
    return cursor.skip(page * take).limit(take);
  }

  async count(query: FilterQuery2<T>): Promise<number> {
    return await (await this.getCollection()).countDocuments(query, {});
  }

  async ensureIndex(spec: any, options: IndexOptions): Promise<string> {
    return await (await this.getCollection()).createIndex(spec, options);
  }
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer UU>
    ? ReadonlyArray<DeepPartial<UU>>
    : T[P] extends ObjectID
    ? T[P]
    : DeepPartial<T[P]>;
};
