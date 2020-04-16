import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';
import {Utils} from '../utils/utils';

export type Discriminate<T, TField extends keyof T, TValue extends T[TField]> = T extends {[field in TField]: TValue}
  ? T
  : never;
export type ABEnum<T extends string> = {[key in T]: number} & {enum: true};
export type ABBitmask<T> = {[keyT in keyof T]-?: number} & {bitmask: true};
export type ABArray = {arraySize: 'uint8' | 'uint16'};
export type ABTypeLookup = {typeLookup: true};
export type ABEntityTypeLookup = {entityTypeLookup: true};
export type AB<T> = T extends string
  ? 'string' | ABEnum<T>
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
    ? ABSizeKeys<T[number]> & ABArray & ABEntityTypeLookup
    : T[number] extends {type: string}
    ? ABKeys<T[number]> & ABArray & ABTypeLookup
    : ABObj<T[number]> & ABArray
  : T extends {[key in keyof T]: boolean}
  ? ABBitmask<T>
  : T extends {type: string}
  ? ABKeys<T> & ABTypeLookup
  : T extends {entityType: string}
  ? ABSizeKeys<T> & ABEntityTypeLookup
  : T extends {}
  ? ABObj<T>
  : never;

export type ABObj<TItem> = {
  [keyT in keyof TItem]: AB<TItem[keyT]>;
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

export class ArrayBufferSchema {
  static debug = false;
  static addSchemaBuffer(buff: ArrayBufferBuilder, value: any, schema: any) {
    if (Array.isArray(value)) {
      this.log('array', schema.arraySize);
      switch (schema.arraySize) {
        case 'uint8':
          buff.addUint8(value.length);
          break;
        case 'uint16':
          buff.addUint16(value.length);
          break;
      }
      for (const valueElement of value) {
        this.addSchemaBuffer(buff, valueElement, schema);
      }
      return;
    }
    this.log('object');
    let currentSchema = schema;
    if ('type' in value) {
      this.log('type', (value as any).type);
      currentSchema = schema[(value as any).type];
      buff.addUint8(currentSchema.type);
    } else if ('entityType' in value) {
      currentSchema = schema[(value as any).entityType];
      buff.addUint8(currentSchema.entityType);
    }
    for (const key of Object.keys(currentSchema)) {
      if (key === 'type' || key === 'entityType' || key === 'arraySize') {
        continue;
      }
      if (Array.isArray(value[key])) {
        this.addSchemaBuffer(buff, value[key], currentSchema[key]);
      } else {
        switch (currentSchema[key]) {
          case 'uint8':
            buff.addUint8(value[key]);
            continue;
          case 'uint16':
            buff.addUint16(value[key]);
            continue;
          case 'uint32':
            buff.addUint32(value[key]);
            continue;
          case 'int8':
            buff.addInt8(value[key]);
            continue;
          case 'int16':
            buff.addInt16(value[key]);
            continue;
          case 'int32':
            buff.addInt32(value[key]);
            continue;
          case 'float32':
            buff.addFloat32(value[key]);
            continue;
          case 'float64':
            buff.addFloat64(value[key]);
            continue;
          case 'boolean':
            buff.addBoolean(value[key]);
            continue;
          case 'string':
            buff.addString(value[key]);
            continue;
          case 'int32Optional':
            buff.addInt32Optional(value[key]);
            continue;
          case 'int8Optional':
            buff.addInt8Optional(value[key]);
            continue;
        }
        if (typeof currentSchema[key] === 'object') {
          if (currentSchema[key].bitmask) {
            const bitmask: boolean[] = [];
            for (const maskKey of Object.keys(currentSchema[key])) {
              if (maskKey === 'bitmask') continue;
              bitmask.push(value[key][maskKey]);
            }
            buff.addBits(...bitmask);
          } else if (currentSchema[key].enum) {
            buff.addUint8(currentSchema[key][value[key]]);
          } else {
            this.addSchemaBuffer(buff, value[key], currentSchema[key]);
          }
        } else {
          debugger;
        }
      }
    }
  }

  static readSchemaBuffer(reader: ArrayBufferReader, schema: any, inArray: boolean = false): any {
    if (!inArray && schema.arraySize) {
      this.log('array', schema.arraySize);
      const length = Utils.switchType(schema.arraySize, {
        uint8: () => reader.readUint8(),
        uint16: () => reader.readUint16(),
      })();
      const items = [];
      for (let i = 0; i < length; i++) {
        const item = this.readSchemaBuffer(reader, schema, true);
        items.push(item);
      }
      return items;
    }
    const obj: any = {};
    let currentSchema = schema;
    if (currentSchema.typeLookup) {
      const type = reader.readUint8();
      let found = false;
      for (const key of Object.keys(currentSchema)) {
        if (currentSchema[key].type === type) {
          obj.type = key;
          currentSchema = currentSchema[key];
          found = true;
          break;
        }
      }
      if (!found) {
        throw new Error('Schema not found: Type ' + type);
      }
    } else if (currentSchema.entityTypeLookup) {
      const entityType = reader.readUint8();
      let found = false;
      for (const key of Object.keys(currentSchema)) {
        if (currentSchema[key].entityType === entityType) {
          this.log('entityType lookup', key);
          obj.entityType = key;
          currentSchema = currentSchema[key];
          found = true;
          break;
        }
      }
      if (!found) {
        throw new Error('Schema not found: Entity Type ' + entityType);
      }
    }
    for (const key of Object.keys(currentSchema)) {
      if (key === 'type' || key === 'entityType' || key === 'arraySize') {
        continue;
      }
      this.log('field', key);
      if (currentSchema[key].arraySize) {
        obj[key] = this.readSchemaBuffer(reader, currentSchema[key]);
      } else {
        this.log('field', key, currentSchema[key]);
        switch (currentSchema[key]) {
          case 'uint8':
            obj[key] = reader.readUint8();
            continue;
          case 'uint16':
            obj[key] = reader.readUint16();
            continue;
          case 'uint32':
            obj[key] = reader.readUint32();
            continue;
          case 'int8':
            obj[key] = reader.readInt8();
            continue;
          case 'int16':
            obj[key] = reader.readInt16();
            continue;
          case 'int32':
            obj[key] = reader.readInt32();
            continue;
          case 'float32':
            obj[key] = reader.readFloat32();
            continue;
          case 'float64':
            obj[key] = reader.readFloat64();
            continue;
          case 'boolean':
            obj[key] = reader.readBoolean();
            continue;
          case 'string':
            obj[key] = reader.readString();
            continue;
          case 'int32Optional':
            obj[key] = reader.readInt32Optional();
            continue;
          case 'int8Optional':
            obj[key] = reader.readInt8Optional();
            continue;
        }
        if (typeof currentSchema[key] === 'object') {
          if (currentSchema[key].bitmask) {
            const maskObj: any = {};
            const bits = reader.readBits();
            for (const maskKey of Object.keys(currentSchema[key])) {
              if (maskKey === 'bitmask') continue;
              maskObj[maskKey] = bits[currentSchema[key][maskKey]];
            }
            obj[key] = maskObj;
          } else if (currentSchema[key].enum) {
            this.log('field enum', key, currentSchema[key].enum);
            const enumValue = reader.readUint8();
            obj[key] = Object.keys(currentSchema[key]).find((enumKey) => currentSchema[key][enumKey] === enumValue);
          } else {
            obj[key] = this.readSchemaBuffer(reader, currentSchema[key]);
          }
        } else {
          debugger;
        }
      }
    }
    return obj;
  }

  static startAddSchemaBuffer(value: any, schema: any) {
    const buf = new ArrayBufferBuilder(1000);
    ArrayBufferSchema.addSchemaBuffer(buf, value, schema);
    return buf.buildBuffer();
  }

  static startReadSchemaBuffer(buffer: ArrayBuffer | ArrayBufferLike, schema: any): any {
    this.log('start read buffer');
    return this.readSchemaBuffer(new ArrayBufferReader(buffer), schema);
  }

  private static log(...messages: string[]) {
    if (this.debug) console.log(...messages);
  }
}
