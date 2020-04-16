import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';
import {assertType, Utils} from '../utils/utils';
import {ABFlags, ABScalars} from './arrayBufferSchemaTypes';
import {unreachable} from '../utils/unreachable';

export class ArrayBufferSchema {
  static debug = false;
  static addSchemaBuffer(buff: ArrayBufferBuilder, value: any, schema: ABFlags, inArray: boolean = false) {
    if (!inArray && schema.arraySize) {
      switch (schema.arraySize) {
        case 'uint8':
          buff.addUint8(value.length);
          break;
        case 'uint16':
          buff.addUint16(value.length);
          break;
      }
      for (const valueElement of value) {
        this.addSchemaBuffer(buff, valueElement, schema, true);
      }
      return;
    }
    let currentSchema = schema;
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
      if (currentSchemaElement.arraySize) {
        this.addSchemaBuffer(buff, value[key], currentSchemaElement);
      } else {
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
  }

  static readSchemaBuffer(reader: ArrayBufferReader, schema: ABFlags, inArray: boolean = false): any {
    if (!inArray && schema.arraySize) {
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
    if (currentSchema.flag === 'type-lookup') {
      const type = reader.readUint8();
      let found = false;
      for (const key of Object.keys(currentSchema)) {
        if (currentSchema[key].type === type) {
          obj.type = key;
          currentSchema = currentSchema[key] as ABFlags;
          found = true;
          break;
        }
      }
      if (!found) {
        throw new Error('Schema not found: Type ' + type);
      }
    } else if (currentSchema.flag === 'entity-type-lookup') {
      const entityType = reader.readUint8();
      let found = false;
      for (const key of Object.keys(currentSchema)) {
        if (currentSchema[key].entityType === entityType) {
          obj.entityType = key;
          currentSchema = currentSchema[key] as ABFlags;
          found = true;
          break;
        }
      }
      if (!found) {
        throw new Error('Schema not found: Entity Type ' + entityType);
      }
    }
    for (const key of Object.keys(currentSchema)) {
      if (key === 'type' || key === 'flag' || key === 'entityType' || key === 'arraySize') {
        continue;
      }
      const currentSchemaElement = (currentSchema as any)[key] as ABFlags;
      if (currentSchemaElement.arraySize) {
        obj[key] = this.readSchemaBuffer(reader, currentSchemaElement);
      } else {
        assertType<ABScalars>(currentSchemaElement);
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
        if (currentSchemaElement in lookup) {
          obj[key] = (lookup as any)[currentSchemaElement]();
        } else {
          const flagLookup = {
            bitmask: () => {
              const maskObj: any = {};
              const bits = reader.readBits();
              for (const maskKey of Object.keys(currentSchemaElement)) {
                if (maskKey === 'flag') continue;
                maskObj[maskKey] = bits[(currentSchemaElement as any)[maskKey]];
              }
              obj[key] = maskObj;
            },
            enum: () => {
              const enumValue = reader.readUint8();
              obj[key] = Object.keys(currentSchemaElement).find(
                (enumKey) => (currentSchemaElement[enumKey as any] as any) === enumValue
              );
            },
            undefined: () => {
              obj[key] = this.readSchemaBuffer(reader, (currentSchema as any)[key as any]);
            },
            'type-lookup': () => {
              obj[key] = this.readSchemaBuffer(reader, (currentSchema as any)[key as any]);
            },
            'entity-type-lookup': () => {
              obj[key] = this.readSchemaBuffer(reader, (currentSchema as any)[key as any]);
            },
          };
          (flagLookup as any)[currentSchemaElement.flag as any]();
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
