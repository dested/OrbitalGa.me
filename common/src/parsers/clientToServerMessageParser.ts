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
      case 'playerInput':
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
      default:
        throw new Error('Missing buffer enum');
    }
  }
}
