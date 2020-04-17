import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';
import {ABFlags, Discriminate} from './arrayBufferSchemaTypes';

export class ArrayBufferSchemaBuilder {
  static addSchemaBuffer(schema: any, fieldName: string, addMap: (code: string) => string) {
    const adderScalarLookup = {
      uint8: `buff.addUint8(${fieldName});`,
      uint16: `buff.addUint16(${fieldName});`,
      uint32: `buff.addUint32(${fieldName});`,
      int8: `buff.addInt8(${fieldName});`,
      int16: `buff.addInt16(${fieldName});`,
      int32: `buff.addInt32(${fieldName});`,
      float32: `buff.addFloat32(${fieldName});`,
      float64: `buff.addFloat64(${fieldName});`,
      boolean: `buff.addBoolean(${fieldName});`,
      string: `buff.addString(${fieldName});`,
      int32Optional: `buff.addInt32Optional(${fieldName});`,
      int8Optional: `buff.addInt8Optional(${fieldName});`,
    };
    const adderFlagLookup = {
      enum: (innerSchema: ABFlags) => {
        let str = '';
        str += `lookup(${fieldName},\r\n`;
        str += '{\r\n';
        for (const key of Object.keys(innerSchema)) {
          if (key === 'flag') continue;
          str += `${key}:()=>buff.addUint8(${(innerSchema as any)[key]}),\r\n`;
        }
        str += '});\r\n';

        return str;
      },
      bitmask: (innerSchema: ABFlags) => {
        const noPeriodsFieldName = fieldName.replace(/\./g, '_');
        let str = `buff.addBits(...[\r\n`;
        for (const key of Object.keys(innerSchema)) {
          if (key === 'flag') continue;
          str += `${fieldName}['${key}'],\r\n`;
        }
        str += `]);\r\n`;
        return str;
      },
      'array-uint8': (innerSchema: Discriminate<ABFlags, 'flag', 'array-uint8'>) => {
        const noPeriodsFieldName = fieldName.replace(/\./g, '_');
        return `
           buff.addUint8(${fieldName}.length);
    for (const ${noPeriodsFieldName}Element of ${fieldName}) {
      ${ArrayBufferSchemaBuilder.addSchemaBuffer(innerSchema.elements, noPeriodsFieldName + 'Element', addMap)}
    }`;
      },
      'array-uint16': (innerSchema: Discriminate<ABFlags, 'flag', 'array-uint16'>) => {
        const noPeriodsFieldName = fieldName.replace(/\./g, '_');
        return `
           buff.addUint16(${fieldName}.length);
    for (const ${noPeriodsFieldName}Element of ${fieldName}) {
      ${ArrayBufferSchemaBuilder.addSchemaBuffer(innerSchema.elements, noPeriodsFieldName + 'Element', addMap)}
    }`;
      },
      'type-lookup': (innerSchema: Discriminate<ABFlags, 'flag', 'type-lookup'>) => {
        let map = '{\r\n';
        for (const key of Object.keys(innerSchema.elements)) {
          map += `${key}:()=>{\r\n`;
          map += `buff.addUint8(${innerSchema.elements[key].type});\r\n`;
          map += `${ArrayBufferSchemaBuilder.addSchemaBuffer(innerSchema.elements[key] as any, fieldName, addMap)}\r\n`;
          map += `},\r\n`;
        }
        map += '}\r\n';
        // const newMapId = addMap(map);

        let str = '';
        str += `lookup(${fieldName}.type,\r\n`;
        str += map + '\r\n';
        str += ');\r\n';
        return str;
      },
      'entity-type-lookup': (innerSchema: Discriminate<ABFlags, 'flag', 'entity-type-lookup'>) => {
        let map = '{\r\n';
        for (const key of Object.keys(innerSchema.elements)) {
          map += `${key}:()=>{\r\n`;
          map += `buff.addUint8(${innerSchema.elements[key].entityType});\r\n`;
          map += `${ArrayBufferSchemaBuilder.addSchemaBuffer(innerSchema.elements[key] as any, fieldName, addMap)}\r\n`;
          map += `},\r\n`;
        }
        map += '}\r\n';
        // const newMapId = addMap(map);

        let str = '';
        str += `lookup(${fieldName}.entityType,\r\n`;
        str += map + '\r\n';
        str += ')\r\n';
        return str;
      },
    };

    if (schema in adderScalarLookup) {
      return (adderScalarLookup as any)[schema] + '\r\n';
    } else {
      if (!schema.flag) {
        let str = '';
        for (const key of Object.keys(schema)) {
          if (key === 'type' || key === 'entityType') {
            continue;
          }
          const currentSchemaElement = (schema as any)[key];
          str += this.addSchemaBuffer(currentSchemaElement, fieldName + '.' + key, addMap) + '\r\n';
        }
        str += '';
        return str;
      }
      if (schema.flag in adderFlagLookup) {
        return (adderFlagLookup as any)[schema.flag](schema as any);
      }
      throw new Error('bad ');
    }
  }

  static generateAdderFunction(schema: any): any {
    const objectMaps: string[] = [];

    let code = this.addSchemaBuffer(schema, 'value', (map) => {
      const id = objectMaps.length;
      objectMaps.push(`const map${id}=${map}`);
      return `map${id}`;
    });

    // language=JavaScript
    code = `
function lookup(id, obj) {
  if(typeof  obj[id] !=='function'){
    console.log(id,obj)
    debugger;
  }
  return obj[id]();
}
(buff, value)=>{
${objectMaps.join(';\r\n')}
${code}
return buff.buildBuffer()
}`;
    // tslint:disable no-eval
    return eval(code);
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

  static readSchemaBuffer(schema: any, addMap: (code: string) => string, injectField?: string): any {
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
      enum: (innerSchema: ABFlags) => {
        let str = '';
        str += 'lookupEnum(reader.readUint8(),\r\n';
        str += '{\r\n';
        for (const key of Object.keys(innerSchema)) {
          if (key === 'flag') continue;
          str += `${(innerSchema as any)[key]}:'${key}',\r\n`;
        }
        str += '})\r\n';
        return str;
      },
      bitmask: (innerSchema: ABFlags) => {
        let str = '';
        str += 'bitmask(reader.readBits(),\r\n';
        str += '{\r\n';
        for (const key of Object.keys(innerSchema)) {
          if (key === 'flag') continue;
          str += `${(innerSchema as any)[key]}:'${key}',\r\n`;
        }
        str += '})\r\n';
        return str;
      },
      'array-uint8': (innerSchema: Discriminate<ABFlags, 'flag', 'array-uint8'>) => {
        let str = 'range(reader.readUint8(),()=>(\r\n';
        str += `${ArrayBufferSchemaBuilder.readSchemaBuffer(innerSchema.elements, addMap)}\r\n`;
        str += `))\r\n`;
        return str;
      },
      'array-uint16': (innerSchema: Discriminate<ABFlags, 'flag', 'array-uint16'>) => {
        let str = 'range(reader.readUint16(),()=>(\r\n';
        str += `${ArrayBufferSchemaBuilder.readSchemaBuffer(innerSchema.elements, addMap)}\r\n`;
        str += `))\r\n`;
        return str;
      },
      'type-lookup': (innerSchema: Discriminate<ABFlags, 'flag', 'type-lookup'>) => {
        let map = '{\r\n';
        for (const key of Object.keys(innerSchema.elements)) {
          map += `${innerSchema.elements[key].type}:()=>(\r\n`;
          map += `${ArrayBufferSchemaBuilder.readSchemaBuffer(
            innerSchema.elements[key] as any,
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
      'entity-type-lookup': (innerSchema: Discriminate<ABFlags, 'flag', 'entity-type-lookup'>) => {
        let map = '{\r\n';
        for (const key of Object.keys(innerSchema.elements)) {
          map += `${innerSchema.elements[key].entityType}:()=>(\r\n`;
          map += `${ArrayBufferSchemaBuilder.readSchemaBuffer(
            innerSchema.elements[key] as any,
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

    if (schema in readerScalarLookup) {
      return (readerScalarLookup as any)[schema] + '\r\n';
    } else {
      if (!schema.flag) {
        let str = '{';
        if (injectField) {
          str += `${injectField},\r\n`;
        }
        for (const key of Object.keys(schema)) {
          if (key === 'type' || key === 'entityType') {
            continue;
          }
          const currentSchemaElement = (schema as any)[key];
          str += `` + key + ' : ' + this.readSchemaBuffer(currentSchemaElement, addMap) + ',\r\n';
        }
        str += '}';
        return str;
      }
      if (schema.flag in readerFlagLookup) {
        return (readerFlagLookup as any)[schema.flag](schema as any);
      }
      throw new Error('bad ');
    }
  }
  static startAddSchemaBuffer(value: any, adderFunction: (buff: ArrayBufferBuilder, value: any) => ArrayBuffer) {
    const arrayBufferBuilder = new ArrayBufferBuilder(1000);
    return adderFunction(arrayBufferBuilder, value);
  }

  static startReadSchemaBuffer(
    buffer: ArrayBuffer | ArrayBufferLike,
    readerFunction: (reader: ArrayBufferReader) => any
  ): any {
    return readerFunction(new ArrayBufferReader(buffer));
  }
}
