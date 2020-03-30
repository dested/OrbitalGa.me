import {Utils} from '../utils/utils';

export class ArrayBufferBuilder {
  buffer = new ArrayBuffer(50000);
  view = new DataView(this.buffer);
  curPosition = 0;

  testSize(added: number) {
    if (this.buffer.byteLength < this.curPosition + added) {
      // console.log('resized', this.buffer.byteLength);
      this.buffer = transfer(this.buffer, this.buffer.byteLength * 4);
      this.view = new DataView(this.buffer);
    }
  }

  addFloat32(value: number) {
    this.testSize(4);
    this.view.setFloat32(this.curPosition, value);
    this.curPosition += 4;
  }

  addFloat64(value: number) {
    this.testSize(8);
    this.view.setFloat64(this.curPosition, value);
    this.curPosition += 8;
  }

  addInt8(value: number) {
    this.testSize(1);
    this.view.setInt8(this.curPosition, value);
    this.curPosition += 1;
  }

  addInt16(value: number) {
    this.testSize(2);
    this.view.setInt16(this.curPosition, value);
    this.curPosition += 2;
  }

  addInt32(value: number) {
    this.testSize(4);
    this.view.setInt32(this.curPosition, value);
    this.curPosition += 4;
  }

  addUint8(value: number) {
    this.testSize(1);
    this.view.setUint8(this.curPosition, value);
    this.curPosition += 1;
  }

  addUint16(value: number) {
    this.testSize(2);
    this.view.setUint16(this.curPosition, value);
    this.curPosition += 2;
  }

  addUint32(value: number) {
    this.testSize(4);
    this.view.setUint32(this.curPosition, value);
    this.curPosition += 4;
  }

  addOptionalInt32(value?: number) {
    if (value === undefined) {
      this.addInt32(-1);
    } else {
      this.addInt32(value);
    }
  }

  buildBuffer(): ArrayBuffer {
    // console.log('buffer', this.curPosition);
    return this.buffer.slice(0, this.curPosition);
  }

  addString(str: string) {
    this.addUint16(str.length);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      this.addUint16(str.charCodeAt(i));
    }
  }
}

export class ArrayBufferReader {
  private index: number;
  private dv: DataView;

  constructor(buffer: ArrayBuffer | ArrayBufferLike) {
    this.dv = new DataView(buffer);
    this.index = 0;
  }

  readFloat32(): number {
    const result = this.dv.getFloat32(this.index);
    this.index += 4;
    return result;
  }

  readFloat64(): number {
    const result = this.dv.getFloat64(this.index);
    this.index += 8;
    return result;
  }

  readInt8(): number {
    const result = this.dv.getInt8(this.index);
    this.index += 1;
    return result;
  }

  readInt16(): number {
    const result = this.dv.getInt16(this.index);
    this.index += 2;
    return result;
  }

  readInt32(): number {
    const result = this.dv.getInt32(this.index);
    this.index += 4;
    return result;
  }

  loop<T>(callback: () => T): T[] {
    const len = this.readUint16();
    const items: T[] = [];
    for (let i = 0; i < len; i++) {
      items.push(callback());
    }
    return items;
  }

  switch<TOptions extends number, TResult>(callback: {[key in TOptions]: () => TResult}): TResult {
    const option = this.readUint8() as TOptions;
    return callback[option]();
  }

  readOptionalInt32(): number | undefined {
    const result = this.dv.getInt32(this.index);
    this.index += 4;
    if (result === -1) {
      return undefined;
    }
    return result;
  }

  readUint8(): number {
    const result = this.dv.getUint8(this.index);
    this.index += 1;
    return result;
  }

  readUint16(): number {
    const result = this.dv.getUint16(this.index);
    this.index += 2;
    return result;
  }

  readUint32(): number {
    const result = this.dv.getUint32(this.index);
    this.index += 4;
    return result;
  }

  readString() {
    const len = this.readUint16();
    const strs: string[] = [];
    for (let i = 0; i < len; i++) {
      strs.push(String.fromCharCode(this.readUint16()));
    }
    return strs.join('');
  }
}

const transfer =
  (ArrayBuffer as any).transfer ||
  ((source: ArrayBuffer, length: number) => {
    if (!(source instanceof ArrayBuffer)) {
      throw new TypeError('Source must be an instance of ArrayBuffer');
    }
    if (length <= source.byteLength) {
      return source.slice(0, length);
    }
    const sourceView = new Uint8Array(source);
    const destView = new Uint8Array(new ArrayBuffer(length));
    destView.set(sourceView);
    return destView.buffer;
  });
