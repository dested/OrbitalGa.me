import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';
import {Utils} from '../utils/utils';
import {ServerToClientSchema} from '../models/serverToClientMessages';

export type Discriminate<T, TField extends keyof T, TValue extends T[TField]> = T extends {[field in TField]: TValue}
  ? T
  : never;

export type SizeArray = {arraySize: 'uint8' | 'uint16'};
export type SizeTypeLookup = {typeLookup: true};
export type SizeEntityTypeLookup = {entityTypeLookup: true};
export type Size<T> = T extends string
  ? 'string' | ({[key in T]: number} & {enum: true})
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
    ? EntitySizeKeys<T[number]> & SizeArray & SizeEntityTypeLookup
    : T[number] extends {type: string}
    ? SizeKeys<T[number]> & SizeArray & SizeTypeLookup
    : SizeObj<T[number]> & SizeArray
  : T extends {[key in keyof T]: boolean}
  ? BitObject<T> & {bitmask: true}
  : T extends {type: string}
  ? SizeKeys<T> & SizeTypeLookup
  : T extends {entityType: string}
  ? EntitySizeKeys<T> & SizeEntityTypeLookup
  : T extends {}
  ? SizeObj<T>
  : never;

export type BitObject<T> = {
  [keyT in keyof T]-?: number;
};

export type SizeObj<TItem> = {
  [keyT in keyof TItem]: Size<TItem[keyT]>;
};

export type SizeByType<TItem extends {type: string}, TKey extends TItem['type']> = SizeObj<
  Omit<Discriminate<TItem, 'type', TKey>, 'type'>
> & {type: number};

export type EntitySizeByType<TItem extends {entityType: string}, TKey extends TItem['entityType']> = SizeObj<
  Omit<Discriminate<TItem, 'entityType', TKey>, 'entityType'>
> & {entityType: number};

export type SizeKeys<TItem extends {type: string}> = {
  [key in TItem['type']]: SizeByType<TItem, key>;
};

export type EntitySizeKeys<TItem extends {entityType: string}> = {
  [key in TItem['entityType']]: EntitySizeByType<TItem, key>;
};

export class ArrayBufferSchema {
  static addSchemaBuffer(buff: ArrayBufferBuilder, value: any, schema: any) {
    if (Array.isArray(value)) {
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
    let currentSchema = schema;
    if ('type' in value) {
      currentSchema = schema[(value as any).type];
      buff.addUint8(currentSchema.type);
    } else if ('entityType' in value) {
      if (!((value as any).entityType in schema)) {
        console.log((value as any).entityType);
      }
      currentSchema = schema[(value as any).entityType];
      buff.addUint8(currentSchema.entityType);
    }
    for (const key of Object.keys(currentSchema)) {
      if (key === 'type' || key === 'entityType') {
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
      const length = Utils.switchType(schema.arraySize, {
        uint8: () => reader.readUint8(),
        uint16: () => reader.readUint16(),
      })();
      const items = [];
      for (let i = 0; i < length; i++) {
        items.push(this.readSchemaBuffer(reader, schema, true));
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
      if (key === 'type' || key === 'entityType') {
        continue;
      }

      if (currentSchema[key].arraySize) {
        obj[key] = this.readSchemaBuffer(reader, currentSchema[key]);
      } else {
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
    return this.readSchemaBuffer(new ArrayBufferReader(buffer), schema);
  }
}
