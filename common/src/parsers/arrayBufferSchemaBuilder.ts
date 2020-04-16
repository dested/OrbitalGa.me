import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';
import {assertType, Utils} from '../utils/utils';
import {AB, ABFlags, ABScalars, Discriminate} from './arrayBufferSchemaTypes';
import {unreachable} from '../utils/unreachable';
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

export class ArrayBufferSchemaBuilder {
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

  static generateReaderFunction(schema: any): any {
    const objectMaps: string[] = [];

    let code = this.readSchemaBuffer(schema, (map) => {
      const id = objectMaps.length;
      objectMaps.push(`const map${id}=${map}`);
      return `map${id}`;
    });

    // language=JavaScript
    code = `
    function range(len, callback) {
  let items = [];
  for (let i = 0; i < len; i++) {
    items.push(callback());
  }
  return items;
}
function lookup(id, obj) {
  return obj[id]();
}
function lookupEnum(id, obj) {
  return obj[id];
}
function bitmask(mask, obj) {
  const result = {};
  for (let i = 0; i < mask.length; i++) {
    result[obj[i]] = !!mask[i];
  }
  return result;
}

(reader)=>{
${objectMaps.join(';\r\n')}
return (${code})
}`;
    // tslint:disable no-eval
    return eval(code);
  }

  static readSchemaBuffer(schemaO: ABFlags, addMap: (code: string) => string, injectField?: string): any {
    assertType<ABScalars>(schemaO);

    const readerScalarLookup = {
      uint8: 'reader.readUint8()',
      uint16: 'reader.readUint16()',
      uint32: 'reader.readUint32()',
      int8: 'reader.readInt8()',
      int16: 'reader.readInt16()',
      int32: 'reader.readInt32()',
      float32: 'reader.readFloat32()',
      float64: 'reader.readFloat64()',
      boolean: 'reader.readBoolean()',
      string: 'reader.readString()',
      int32Optional: 'reader.readInt32Optional()',
      int8Optional: 'reader.readInt8Optional()',
    };
    const readerFlagLookup = {
      enum: (schema: ABFlags) => {
        let str = '';
        str += 'lookupEnum(reader.readUint8(),\r\n';
        str += '{\r\n';
        for (const key of Object.keys(schema)) {
          if (key === 'flag') continue;
          str += `${(schema as any)[key]}:'${key}',\r\n`;
        }
        str += '})\r\n';
        return str;
      },
      bitmask: (schema: ABFlags) => {
        let str = '';
        str += 'bitmask(reader.readBits(),\r\n';
        str += '{\r\n';
        for (const key of Object.keys(schema)) {
          if (key === 'flag') continue;
          str += `${(schema as any)[key]}:'${key}',\r\n`;
        }
        str += '})\r\n';
        return str;
      },
      'array-uint8': (schema: Discriminate<ABFlags, 'flag', 'array-uint8'>) => {
        let str = 'range(reader.readUint8(),()=>(\r\n';
        str += `${ArrayBufferSchemaBuilder.readSchemaBuffer(schema.elements, addMap)}\r\n`;
        str += `))\r\n`;
        return str;
      },
      'array-uint16': (schema: Discriminate<ABFlags, 'flag', 'array-uint16'>) => {
        let str = 'range(reader.readUint16(),()=>(\r\n';
        str += `${ArrayBufferSchemaBuilder.readSchemaBuffer(schema.elements, addMap)}\r\n`;
        str += `))\r\n`;
        return str;
      },
      'type-lookup': (schema: Discriminate<ABFlags, 'flag', 'type-lookup'>) => {
        let map = '{\r\n';
        for (const key of Object.keys(schema.elements)) {
          map += `${schema.elements[key].type}:()=>(\r\n`;
          map += `${ArrayBufferSchemaBuilder.readSchemaBuffer(
            schema.elements[key] as any,
            addMap,
            `type: '${key}'`
          )}\r\n`;
          map += `),\r\n`;
        }
        map += '}\r\n';
        const newMapId = addMap(map);

        let str = '';
        str += 'lookup(reader.readUint8(),\r\n';
        str += newMapId + '\r\n';
        str += ')\r\n';
        return str;
      },
      'entity-type-lookup': (schema: Discriminate<ABFlags, 'flag', 'entity-type-lookup'>) => {
        let map = '{\r\n';
        for (const key of Object.keys(schema.elements)) {
          map += `${schema.elements[key].entityType}:()=>(\r\n`;
          map += `${ArrayBufferSchemaBuilder.readSchemaBuffer(
            schema.elements[key] as any,
            addMap,
            `entityType: '${key}'`
          )}\r\n`;
          map += `),\r\n`;
        }
        map += '}\r\n';
        const newMapId = addMap(map);

        let str = '';
        str += 'lookup(reader.readUint8(),\r\n';
        str += newMapId + '\r\n';
        str += ')\r\n';
        return str;
      },
    };

    if (schemaO in readerScalarLookup) {
      return (readerScalarLookup as any)[schemaO] + '\r\n';
    } else {
      if (!schemaO.flag) {
        let str = '{';
        if (injectField) {
          str += `${injectField},\r\n`;
        }
        for (const key of Object.keys(schemaO)) {
          if (key === 'type' || key === 'entityType') {
            continue;
          }
          const currentSchemaElement = (schemaO as any)[key] as ABFlags;
          str += `` + key + ' : ' + this.readSchemaBuffer(currentSchemaElement, addMap) + ',\r\n';
        }
        str += '}';
        return str;
      }
      if (schemaO.flag in readerFlagLookup) {
        return readerFlagLookup[schemaO.flag](schemaO as any);
      }
      throw new Error('bad ');
    }
  }

  private static log(...messages: string[]) {
    if (this.debug) console.log(...messages);
  }
}
