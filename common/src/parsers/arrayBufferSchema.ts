import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';
export class ArrayBufferSchema {
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
