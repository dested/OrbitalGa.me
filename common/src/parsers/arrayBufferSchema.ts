import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';
import {assertType, Utils} from '../utils/utils';
import {AB, ABFlags, ABScalars, Discriminate} from './arrayBufferSchemaTypes';
import {unreachable} from '../utils/unreachable';
const readerScalarLookup = {
  uint8: (reader: ArrayBufferReader) => reader.readUint8(),
  uint16: (reader: ArrayBufferReader) => reader.readUint16(),
  uint32: (reader: ArrayBufferReader) => reader.readUint32(),
  int8: (reader: ArrayBufferReader) => reader.readInt8(),
  int16: (reader: ArrayBufferReader) => reader.readInt16(),
  int32: (reader: ArrayBufferReader) => reader.readInt32(),
  float32: (reader: ArrayBufferReader) => reader.readFloat32(),
  float64: (reader: ArrayBufferReader) => reader.readFloat64(),
  boolean: (reader: ArrayBufferReader) => reader.readBoolean(),
  string: (reader: ArrayBufferReader) => reader.readString(),
  int32Optional: (reader: ArrayBufferReader) => reader.readInt32Optional(),
  int8Optional: (reader: ArrayBufferReader) => reader.readInt8Optional(),
};
const readerFlagLookup = {
  enum: (reader: ArrayBufferReader, schema: ABFlags) => {
    const enumValue = reader.readUint8();
    return Object.keys(schema).find((enumKey) => (schema as any)[enumKey] === enumValue);
  },
  bitmask: (reader: ArrayBufferReader, schema: ABFlags) => {
    const maskObj: any = {};
    const bits = reader.readBits();
    for (const maskKey of Object.keys(schema)) {
      if (maskKey === 'flag') continue;
      maskObj[maskKey] = bits[(schema as any)[maskKey]];
    }
    return maskObj;
  },
  'array-uint8': (reader: ArrayBufferReader, schema: Discriminate<ABFlags, 'flag', 'array-uint8'>) => {
    const length = reader.readUint8();
    const items = [];
    for (let i = 0; i < length; i++) {
      const item = ArrayBufferSchema.readSchemaBuffer(reader, schema.elements);
      items.push(item);
    }
    return items;
  },
  'array-uint16': (reader: ArrayBufferReader, schema: Discriminate<ABFlags, 'flag', 'array-uint16'>) => {
    const length = reader.readUint16();
    const items = [];
    for (let i = 0; i < length; i++) {
      const item = ArrayBufferSchema.readSchemaBuffer(reader, schema.elements);
      items.push(item);
    }
    return items;
  },
  'type-lookup': (reader: ArrayBufferReader, schema: Discriminate<ABFlags, 'flag', 'type-lookup'>) => {
    const type = reader.readUint8();
    for (const key of Object.keys(schema.elements)) {
      if (schema.elements[key].type === type) {
        return {type: key, ...ArrayBufferSchema.readSchemaBuffer(reader, schema.elements[key] as any)};
      }
    }
    throw new Error('Schema not found: Type ' + type);
  },
  'entity-type-lookup': (reader: ArrayBufferReader, schema: Discriminate<ABFlags, 'flag', 'entity-type-lookup'>) => {
    const entityType = reader.readUint8();
    for (const key of Object.keys(schema.elements)) {
      if (schema.elements[key].entityType === entityType) {
        return {entityType: key, ...ArrayBufferSchema.readSchemaBuffer(reader, schema.elements[key] as any)};
      }
    }
    throw new Error('Schema not found: Entity Type ' + entityType);
  },
};
const writerScalarLookup = {
  uint8: (buff: ArrayBufferBuilder, value: any) => buff.addUint8(value),
  uint16: (buff: ArrayBufferBuilder, value: any) => buff.addUint16(value),
  uint32: (buff: ArrayBufferBuilder, value: any) => buff.addUint32(value),
  int8: (buff: ArrayBufferBuilder, value: any) => buff.addInt8(value),
  int16: (buff: ArrayBufferBuilder, value: any) => buff.addInt16(value),
  int32: (buff: ArrayBufferBuilder, value: any) => buff.addInt32(value),
  float32: (buff: ArrayBufferBuilder, value: any) => buff.addFloat32(value),
  float64: (buff: ArrayBufferBuilder, value: any) => buff.addFloat64(value),
  boolean: (buff: ArrayBufferBuilder, value: any) => buff.addBoolean(value),
  string: (buff: ArrayBufferBuilder, value: any) => buff.addString(value),
  int32Optional: (buff: ArrayBufferBuilder, value: any) => buff.addInt32Optional(value),
  int8Optional: (buff: ArrayBufferBuilder, value: any) => buff.addInt8Optional(value),
};

const writerFlagLookup = {
  bitmask: (buff: ArrayBufferBuilder, schema: ABFlags, value: any) => {
    const bitmask: boolean[] = [];
    for (const maskKey of Object.keys(schema)) {
      if (maskKey === 'flag') continue;
      bitmask.push(value[maskKey]);
    }
    buff.addBits(...bitmask);
  },
  'array-uint8': (buff: ArrayBufferBuilder, schema: Discriminate<ABFlags, 'flag', 'array-uint8'>, value: any) => {
    buff.addUint8(value.length);
    for (const valueElement of value) {
      ArrayBufferSchema.addSchemaBuffer(buff, valueElement, schema.elements);
    }
  },
  'array-uint16': (buff: ArrayBufferBuilder, schema: Discriminate<ABFlags, 'flag', 'array-uint16'>, value: any) => {
    buff.addUint16(value.length);
    for (const valueElement of value) {
      ArrayBufferSchema.addSchemaBuffer(buff, valueElement, schema.elements);
    }
  },
  enum: (buff: ArrayBufferBuilder, schema: ABFlags, value: any) => {
    buff.addUint8(((schema as any)[value] as any) as number);
  },
  'type-lookup': (buff: ArrayBufferBuilder, schema: Discriminate<ABFlags, 'flag', 'type-lookup'>, value: any) => {
    buff.addUint8(schema.elements[value.type].type);
    ArrayBufferSchema.addSchemaBuffer(buff, value, schema.elements[value.type] as any);
  },
  'entity-type-lookup': (
    buff: ArrayBufferBuilder,
    schema: Discriminate<ABFlags, 'flag', 'entity-type-lookup'>,
    value: any
  ) => {
    buff.addUint8(schema.elements[value.entityType].entityType);
    ArrayBufferSchema.addSchemaBuffer(buff, value, schema.elements[value.entityType] as any);
  },
};

export class ArrayBufferSchema {
  static debug = false;
  static addSchemaBuffer(buff: ArrayBufferBuilder, value: any, schemaO: ABFlags) {
    assertType<ABScalars>(schemaO);
    if (schemaO in writerScalarLookup) {
      return (writerScalarLookup as any)[schemaO](buff, value);
    } else {
      if (!schemaO.flag) {
        const obj: any = {};
        for (const key of Object.keys(schemaO)) {
          if (key === 'type' || key === 'entityType') {
            continue;
          }
          const currentSchemaElement = (schemaO as any)[key] as ABFlags;
          obj[key] = this.addSchemaBuffer(buff, value[key], currentSchemaElement);
        }
        return obj;
      }
      if (schemaO.flag in writerFlagLookup) {
        return writerFlagLookup[schemaO.flag](buff, schemaO as any, value);
      }
      throw new Error('bad ');
    }
  }

  static readSchemaBuffer(reader: ArrayBufferReader, schemaO: ABFlags): any {
    assertType<ABScalars>(schemaO);
    if (schemaO in readerScalarLookup) {
      return (readerScalarLookup as any)[schemaO](reader);
    } else {
      if (!schemaO.flag) {
        const obj: any = {};
        for (const key of Object.keys(schemaO)) {
          if (key === 'type' || key === 'entityType') {
            continue;
          }
          const currentSchemaElement = (schemaO as any)[key] as ABFlags;
          obj[key] = this.readSchemaBuffer(reader, currentSchemaElement);
        }
        return obj;
      }
      if (schemaO.flag in readerFlagLookup) {
        return readerFlagLookup[schemaO.flag](reader, schemaO as any);
      }
      throw new Error('bad ');
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
