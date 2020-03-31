import {ClientToServerMessage} from '../models/messages';
import {unreachable} from '../utils/unreachable';
import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';
import {Utils} from '../utils/utils';

export class ClientToServerMessageParser {
  static fromClientToServerMessage(message: ClientToServerMessage) {
    const buff = new ArrayBufferBuilder();

    switch (message.type) {
      case 'join':
        buff.addUint8(1);
        break;
      case 'playerInput':
        buff.addUint8(2);
        buff.addUint32(message.inputSequenceNumber);
        buff.addFloat32(message.pressTime);
        buff.addUint8(Utils.bitsToInt(message.up, message.down, message.left, message.right, message.shoot));
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
          type: 'playerInput',
          inputSequenceNumber: reader.readUint32(),
          pressTime: reader.readFloat32(),
          ...(() => {
            const [up, down, left, right, shoot] = Utils.intToBits(reader.readUint8());
            return {up, down, left, right, shoot};
          })(),
        };
      default:
        throw new Error('Missing buffer enum');
    }
  }
}
