import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {ABFlags, ABSchemaDef} from './schemaDefinerTypes';
import {assertType, Utils} from '../utils/utils';

export class SchemaDefiner {
  static generateAdderFunction(schema: any): any {
    const objectMaps: string[] = [];

    let code = this.buildAdderFunction(schema, 'value', (map) => {
      const id = objectMaps.length;
      objectMaps.push(`const map${id}=${map}`);
      return `map${id}`;
    });

    // language=JavaScript
    code = `
(buff, value)=>{
${objectMaps.join(';\n')}
${code}
return buff.buildBuffer()
}`;
    // tslint:disable no-eval
    return eval(code);
  }
  static generateAdderSizeFunction(schema: any): any {
    const objectMaps: string[] = [];

    let code = this.buildAdderSizeFunction(schema, 'value', (map) => {
      const id = objectMaps.length;
      objectMaps.push(`const map${id}=${map}`);
      return `map${id}`;
    });

    // language=JavaScript
    code = `
var sum=(items)=>{
  let c=0;
  for (let i = 0; i < items.length; i++) {
    c+=items[i];
  }
  return c;
};
(value)=>{
${objectMaps.join(';\n')}
return (${code}0);
}`;
    // console.log(code);
    // tslint:disable no-eval
    return eval(code);
  }
  static generateReaderFunction(schema: any): any {
    const objectMaps: string[] = [];

    let code = this.buildReaderFunction(schema, (map) => {
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
${objectMaps.join(';\n')}
return (${code})
}`;
    // tslint:disable no-eval
    return eval(code);
  }

  static startAddSchemaBuffer(
    value: any,
    adderSizeFunction: (value: any) => number,
    adderFunction: (buff: ArrayBufferBuilder, value: any) => ArrayBuffer
  ) {
    const size = adderSizeFunction(value);
    const arrayBufferBuilder = new ArrayBufferBuilder(size, true);
    return adderFunction(arrayBufferBuilder, value);
  }

  static startReadSchemaBuffer(
    buffer: ArrayBuffer | ArrayBufferLike,
    readerFunction: (reader: ArrayBufferReader) => any
  ): any {
    return readerFunction(new ArrayBufferReader(buffer));
  }

  private static buildAdderFunction(schema: ABSchemaDef, fieldName: string, addMap: (code: string) => string): string {
    switch (schema) {
      case 'uint8':
        return `buff.addUint8(${fieldName});\n`;
      case 'uint16':
        return `buff.addUint16(${fieldName});\n`;
      case 'uint32':
        return `buff.addUint32(${fieldName});\n`;
      case 'int8':
        return `buff.addInt8(${fieldName});\n`;
      case 'int16':
        return `buff.addInt16(${fieldName});\n`;
      case 'int32':
        return `buff.addInt32(${fieldName});\n`;
      case 'float32':
        return `buff.addFloat32(${fieldName});\n`;
      case 'float64':
        return `buff.addFloat64(${fieldName});\n`;
      case 'boolean':
        return `buff.addBoolean(${fieldName});\n`;
      case 'string':
        return `buff.addString(${fieldName});\n`;
      case 'int32Optional':
        return `buff.addInt32Optional(${fieldName});\n`;
      case 'int8Optional':
        return `buff.addInt8Optional(${fieldName});\n`;
      default:
        assertType<ABFlags>(schema);
        switch (schema.flag) {
          case 'enum': {
            return `({ 
${Utils.safeKeysExclude(schema, 'flag')
  .map((key) => `${key}:()=>buff.addUint8(${schema[key]}),`)
  .join('\n')}
})[${fieldName}]();`;
          }
          case 'bitmask': {
            return `buff.addBits(...[
${Utils.safeKeysExclude(schema, 'flag')
  .map((key) => `${fieldName}['${key}'],`)
  .join('\n')}
]);`;
          }

          case 'array-uint8': {
            const noPeriodsFieldName = fieldName.replace(/\./g, '_');
            return `
           buff.addUint8(${fieldName}.length);
    for (const ${noPeriodsFieldName}Element of ${fieldName}) {
      ${SchemaDefiner.buildAdderFunction(schema.elements, noPeriodsFieldName + 'Element', addMap)}
    }`;
          }
          case 'array-uint16': {
            const noPeriodsFieldName = fieldName.replace(/\./g, '_');
            return `
           buff.addUint16(${fieldName}.length);
    for (const ${noPeriodsFieldName}Element of ${fieldName}) {
      ${SchemaDefiner.buildAdderFunction(schema.elements, noPeriodsFieldName + 'Element', addMap)}
    }`;
          }
          case 'type-lookup': {
            let map = '{\n';
            let index = 0;
            for (const key of Object.keys(schema.elements)) {
              map += `${key}:()=>{
              buff.addUint8(${index});
              ${SchemaDefiner.buildAdderFunction(schema.elements[key], fieldName, addMap)}
              },`;
              index++;
            }
            map += '}\n';
            return `(${map})[${fieldName}.type]();`;
          }
          case undefined:
            let result = '';
            for (const key of Object.keys(schema)) {
              if (key === 'type' || key === 'entityType') {
                continue;
              }
              const currentSchemaElement = schema[key];
              result += this.buildAdderFunction(currentSchemaElement, `${fieldName}.${key}`, addMap) + '\n';
            }
            return result;
        }
    }
    throw new Error('Buffer error');
  }
  private static buildAdderSizeFunction(
    schema: ABSchemaDef,
    fieldName: string,
    addMap: (code: string) => string
  ): string {
    switch (schema) {
      case 'uint8':
        return `1+`;
      case 'uint16':
        return `2+`;
      case 'uint32':
        return `4+`;
      case 'int8':
        return `1+`;
      case 'int16':
        return `2+`;
      case 'int32':
        return `4+`;
      case 'float32':
        return `4+`;
      case 'float64':
        return `8+`;
      case 'boolean':
        return `1+`;
      case 'string':
        return `2+${fieldName}.length*2+`;
      case 'int32Optional':
        return `4+`;
      case 'int8Optional':
        return `1+`;
      default:
        assertType<ABFlags>(schema);
        switch (schema.flag) {
          case 'enum': {
            return `1+`;
          }
          case 'bitmask': {
            return `1+`;
          }
          case 'array-uint8': {
            const noPeriodsFieldName = fieldName.replace(/\./g, '_');
            return `1+sum(${fieldName}.map(${noPeriodsFieldName + 'Element'}=>(${SchemaDefiner.buildAdderSizeFunction(
              schema.elements,
              noPeriodsFieldName + 'Element',
              addMap
            )}0)))+`;
          }
          case 'array-uint16': {
            const noPeriodsFieldName = fieldName.replace(/\./g, '_');
            return `2+sum(${fieldName}.map(${noPeriodsFieldName + 'Element'}=>(${SchemaDefiner.buildAdderSizeFunction(
              schema.elements,
              noPeriodsFieldName + 'Element',
              addMap
            )}0)))+`;
          }
          case 'type-lookup': {
            let map = '{\n';
            let index = 0;
            for (const key of Object.keys(schema.elements)) {
              map += `${key}:()=>1+${SchemaDefiner.buildAdderSizeFunction(schema.elements[key], fieldName, addMap)}0,`;
              index++;
            }
            map += '}';
            return `(${map})[${fieldName}.type]()+`;
          }
          case undefined:
            let result = '';
            for (const key of Object.keys(schema)) {
              if (key === 'type' || key === 'entityType') {
                continue;
              }
              const currentSchemaElement = schema[key];
              result += this.buildAdderSizeFunction(currentSchemaElement, `${fieldName}.${key}`, addMap) + '';
            }
            return result + '0+';
        }
    }
    throw new Error('Buffer error');
  }

  private static buildReaderFunction(schema: ABSchemaDef, addMap: (code: string) => string, injectField?: string): any {
    switch (schema) {
      case 'uint8':
        return 'reader.readUint8()';
      case 'uint16':
        return 'reader.readUint16()';
      case 'uint32':
        return 'reader.readUint32()';
      case 'int8':
        return 'reader.readInt8()';
      case 'int16':
        return 'reader.readInt16()';
      case 'int32':
        return 'reader.readInt32()';
      case 'float32':
        return 'reader.readFloat32()';
      case 'float64':
        return 'reader.readFloat64()';
      case 'boolean':
        return 'reader.readBoolean()';
      case 'string':
        return 'reader.readString()';
      case 'int32Optional':
        return 'reader.readInt32Optional()';
      case 'int8Optional':
        return 'reader.readInt8Optional()';
      default:
        assertType<ABFlags>(schema);
        switch (schema.flag) {
          case 'enum': {
            return `lookupEnum(reader.readUint8(),{${Utils.safeKeysExclude(schema, 'flag')
              .map((key) => `${schema[key]}:'${key}'`)
              .join(',')}})`;
          }
          case 'bitmask': {
            return `bitmask(reader.readBits(), {${Utils.safeKeysExclude(schema, 'flag')
              .map((key) => `${schema[key]}:'${key}'`)
              .join(',')}})`;
          }

          case 'array-uint8': {
            return `range(reader.readUint8(),()=>(${SchemaDefiner.buildReaderFunction(schema.elements, addMap)}))`;
          }
          case 'array-uint16': {
            return `range(reader.readUint16(),()=>(${SchemaDefiner.buildReaderFunction(schema.elements, addMap)}))`;
          }
          case 'type-lookup': {
            let map = '{\n';
            let index = 0;
            for (const key of Object.keys(schema.elements)) {
              map += `${index}:()=>(
              ${SchemaDefiner.buildReaderFunction(schema.elements[key], addMap, `type: '${key}'`)}
              ),\n`;
              index++;
            }
            map += '}\n';
            const newMapId = addMap(map);
            return `lookup(reader.readUint8(),${newMapId})\n`;
          }
          case undefined: {
            let str = '{';
            if (injectField) {
              str += `${injectField},\n`;
            }
            for (const key of Object.keys(schema)) {
              if (key === 'type' || key === 'entityType') {
                continue;
              }
              const currentSchemaElement = schema[key];
              str += `${key} : ${this.buildReaderFunction(currentSchemaElement, addMap)},\n`;
            }
            str += '}';
            return str;
          }
        }
    }
    throw new Error('Buffer error');
  }
}
