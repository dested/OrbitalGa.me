import {ClientToServerMessage} from '../models/messages';
import {unreachable} from '../utils/unreachable';
import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';

export class ClientToServerMessageParser {
  static fromClientToServerMessage(message: ClientToServerMessage) {
    const buff = new ArrayBufferBuilder();

    switch (message.type) {
      case 'join':
        buff.addUint8(1);
        break;
      case 'join2':
        buff.addUint8(2);
        break;
      default:
        throw unreachable(message);
    }
    return buff.buildBuffer();
  }

  static toClientToServerMessage(buffer: ArrayBuffer): ClientToServerMessage {
    const reader = new ArrayBufferReader(buffer);
    const type = reader.readUint8();

    switch (type) {
      case 1:
        return {
          type: 'join',
        };
      case 2:
        return {
          type: 'join2',
        };
      default:
        throw new Error('Missing buffer enum');
    }
  }
}
