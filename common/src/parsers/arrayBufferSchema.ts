import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';
import {assertType, Utils} from '../utils/utils';
import {AB, ABFlags, ABScalars} from './arrayBufferSchemaTypes';
import {unreachable} from '../utils/unreachable';

export class ArrayBufferSchema {
  static debug = false;
  static addSchemaBuffer(buff: ArrayBufferBuilder, value: any, schema: ABFlags) {
    if (!schema) {
      debugger;
    }
    switch (schema.flag) {
      case 'array-uint8':
        buff.addUint8(value.length);
        for (const valueElement of value) {
          this.addSchemaBuffer(buff, valueElement, schema.elements);
        }
        return;
      case 'array-uint16':
        buff.addUint16(value.length);
        for (const valueElement of value) {
          this.addSchemaBuffer(buff, valueElement, schema.elements);
        }
        return;
    }
    let currentSchema = schema as any;
    if (currentSchema.flag === 'type-lookup') {
      buff.addUint8(currentSchema[value.type].type);
      currentSchema = currentSchema[value.type] as ABFlags;
    } else if (currentSchema.flag === 'entity-type-lookup') {
      buff.addUint8(currentSchema[value.entityType].entityType);
      currentSchema = currentSchema[value.entityType] as ABFlags;
    }
    for (const key of Object.keys(currentSchema)) {
      if (key === 'type' || key === 'flag' || key === 'entityType' || key === 'arraySize') {
        continue;
      }
      const currentSchemaElement = (currentSchema as any)[key] as ABFlags;

      assertType<ABScalars>(currentSchemaElement);

      const lookup = {
        uint8: () => buff.addUint8(value[key]),
        uint16: () => buff.addUint16(value[key]),
        uint32: () => buff.addUint32(value[key]),
        int8: () => buff.addInt8(value[key]),
        int16: () => buff.addInt16(value[key]),
        int32: () => buff.addInt32(value[key]),
        float32: () => buff.addFloat32(value[key]),
        float64: () => buff.addFloat64(value[key]),
        boolean: () => buff.addBoolean(value[key]),
        string: () => buff.addString(value[key]),
        int32Optional: () => buff.addInt32Optional(value[key]),
        int8Optional: () => buff.addInt8Optional(value[key]),
      };

      if (currentSchemaElement in lookup) {
        (lookup as any)[currentSchemaElement]();
      } else {
        const flagLookup = {
          bitmask: () => {
            const bitmask: boolean[] = [];
            for (const maskKey of Object.keys(currentSchemaElement)) {
              if (maskKey === 'flag') continue;
              bitmask.push(value[key][maskKey]);
            }
            buff.addBits(...bitmask);
          },
          'array-uint8': () => {
            this.addSchemaBuffer(buff, value[key], currentSchemaElement);
          },
          'array-uint16': () => {
            this.addSchemaBuffer(buff, value[key], currentSchemaElement);
          },
          enum: () => {
            buff.addUint8((currentSchemaElement[value[key]] as any) as number);
          },
          undefined: () => {
            this.addSchemaBuffer(buff, value[key], currentSchemaElement);
          },
          'type-lookup': () => {
            this.addSchemaBuffer(buff, value[key], currentSchemaElement);
          },
          'entity-type-lookup': () => {
            this.addSchemaBuffer(buff, value[key], currentSchemaElement);
          },
        };
        (flagLookup as any)[currentSchemaElement.flag as any]();
      }
    }
  }

  static readSchemaBuffer(reader: ArrayBufferReader, schema: ABFlags): any {
    assertType<ABScalars>(schema);
    const lookup = {
      uint8: () => reader.readUint8(),
      uint16: () => reader.readUint16(),
      uint32: () => reader.readUint32(),
      int8: () => reader.readInt8(),
      int16: () => reader.readInt16(),
      int32: () => reader.readInt32(),
      float32: () => reader.readFloat32(),
      float64: () => reader.readFloat64(),
      boolean: () => reader.readBoolean(),
      string: () => reader.readString(),
      int32Optional: () => reader.readInt32Optional(),
      int8Optional: () => reader.readInt8Optional(),
    };
    if (schema in lookup) {
      return (lookup as any)[schema]();
    } else {
      switch (schema.flag) {
        case 'enum':
          const enumValue = reader.readUint8();
          return Object.keys(schema).find((enumKey) => (schema as any)[enumKey] === enumValue);
        case 'bitmask':
          const maskObj: any = {};
          const bits = reader.readBits();
          for (const maskKey of Object.keys(schema)) {
            if (maskKey === 'flag') continue;
            maskObj[maskKey] = bits[(schema as any)[maskKey]];
          }
          return maskObj;
        case 'array-uint8': {
          const length = reader.readUint8();
          const items = [];
          for (let i = 0; i < length; i++) {
            const item = this.readSchemaBuffer(reader, schema.elements);
            items.push(item);
          }
          return items;
        }
        case 'array-uint16': {
          const length = reader.readUint16();
          const items = [];
          for (let i = 0; i < length; i++) {
            const item = this.readSchemaBuffer(reader, schema.elements);
            items.push(item);
          }
          return items;
        }
        case 'type-lookup': {
          let found = false;
          const type = reader.readUint8();
          const obj: any = {};
          for (const key of Object.keys(schema)) {
            if (schema[key].type === type) {
              found = true;
              obj.type = key;
              schema = schema[key] as ABFlags;
              break;
            }
          }
          if (found) {
            for (const key of Object.keys(schema)) {
              if (key === 'type' || key === 'flag' || key === 'entityType' || key === 'arraySize') {
                continue;
              }
              obj[key] = this.readSchemaBuffer(reader, (schema as any)[key] as ABFlags);
            }
            return obj;
          }
          throw new Error('Schema not found: Type ' + type);
        }
        case 'entity-type-lookup': {
          const entityType = reader.readUint8();
          const obj: any = {};
          let found = false;
          for (const key of Object.keys(schema)) {
            if (schema[key].entityType === entityType) {
              obj.entityType = key;
              schema = schema[key] as ABFlags;
              found = true;
              break;
            }
          }

          if (found) {
            for (const key of Object.keys(schema)) {
              if (key === 'type' || key === 'flag' || key === 'entityType' || key === 'arraySize') {
                continue;
              }
              obj[key] = this.readSchemaBuffer(reader, (schema as any)[key] as ABFlags);
            }
            return obj;
          }
          throw new Error('Schema not found: Entity Type ' + entityType);
        }
        default: {
          const obj: any = {};
          for (const key of Object.keys(schema)) {
            if (key === 'type' || key === 'flag' || key === 'entityType' || key === 'arraySize') {
              continue;
            }
            const currentSchemaElement = (schema as any)[key] as ABFlags;
            obj[key] = this.readSchemaBuffer(reader, currentSchemaElement);
          }
          return obj;
        }
      }
    }
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
