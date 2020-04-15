import {ClientToServerMessage} from '../models/messages';
import {unreachable} from '../utils/unreachable';
import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';
import {Utils} from '../utils/utils';
import {PlayerEntity} from '../entities/playerEntity';

export class ClientToServerMessageParser {
  static fromClientToServerMessage(message: ClientToServerMessage) {
    const buff = new ArrayBufferBuilder(10);

    switch (message.type) {
      case 'join':
        buff.addUint8(1);
        if (message.name.length > 10) {
          throw new Error('bad');
        }
        buff.addString(message.name);
        break;
      case 'spectate':
        buff.addUint8(2);
        break;
      case 'ping':
        buff.addUint8(3);
        buff.addUint32(message.ping);
        break;
      case 'playerInput':
        buff.addUint8(4);
        buff.addUint32(message.inputSequenceNumber);
        PlayerEntity.addBufferWeaponOptional(buff, message.weapon);
        buff.addBits(message.up, message.down, message.left, message.right, message.shoot);
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
          result = {type: 'join', name: reader.readString()};
          break;
        case 2:
          result = {type: 'spectate'};
          break;
        case 3:
          result = {type: 'ping', ping: reader.readUint32()};
          break;
        case 4:
          result = {
            type: 'playerInput',
            inputSequenceNumber: reader.readUint32(),
            weapon: PlayerEntity.readBufferWeaponOptional(reader),
            ...(() => {
              const [up, down, left, right, shoot] = reader.readBits();
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
