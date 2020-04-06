import {ClientToServerMessage} from '../models/messages';
import {unreachable} from '../utils/unreachable';
import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';
import {Utils} from '../utils/utils';

export class ClientToServerMessageParser {
  static fromClientToServerMessage(message: ClientToServerMessage) {
    const buff = new ArrayBufferBuilder(10);

    switch (message.type) {
      case 'join':
        buff.addUint8(1);
        break;
      case 'spectate':
        buff.addUint8(2);
        break;
      case 'playerInput':
        buff.addUint8(3);
        buff.addUint32(message.inputSequenceNumber);
        buff.addUint8(Utils.bitsToInt(message.up, message.down, message.left, message.right, message.shoot));
        break;
      default:
        throw unreachable(message);
    }
    return buff.buildBuffer();
  }

  static toClientToServerMessage(buffer: ArrayBuffer): ClientToServerMessage | null {
    const reader = new ArrayBufferReader(buffer);
    try {
      let result: ClientToServerMessage;
      const type = reader.readUint8();
      switch (type) {
        case 1:
          result = {type: 'join'};
          break;
        case 2:
          result = {type: 'spectate'};
          break;
        case 3:
          result = {
            type: 'playerInput',
            inputSequenceNumber: reader.readUint32(),
            ...(() => {
              const [up, down, left, right, shoot] = Utils.intToBits(reader.readUint8());
              return {up, down, left, right, shoot};
            })(),
          };
          break;
        default:
          throw new Error('Missing buffer enum');
      }
      reader.done();
      return result;
    } catch (ex) {
      console.error(ex);
      return null;
    }
  }
}
