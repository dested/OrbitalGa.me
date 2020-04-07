import {ServerToClientMessage} from '../models/messages';
import {unreachable} from '../utils/unreachable';
import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';
import {EntityBufferType, EntityBufferValue} from '../models/entityTypeModels';

export class ServerToClientMessageParser {
  static fromServerToClientMessages(messages: ServerToClientMessage[]) {
    const buff = new ArrayBufferBuilder(1000);
    buff.addUint16(messages.length);
    for (const message of messages) {
      switch (message.type) {
        case 'joined':
          buff.addUint8(1);
          EntityBufferType.player.addBuffer(buff, message);
          buff.addUint16(message.serverVersion);
          break;
        case 'spectating':
          buff.addUint8(2);
          buff.addUint16(message.serverVersion);
          break;
        case 'worldState':
          buff.addUint8(3);
          buff.addUint16(message.entities.length);
          for (const entity of message.entities) {
            const type = EntityBufferType[entity.entityType];
            buff.addUint8(type.value);
            type.addBuffer(buff, entity as any);
          }
          break;
        default:
          throw unreachable(message);
      }
    }
    return buff.buildBuffer();
  }

  static toServerToClientMessages(buffer: ArrayBuffer): ServerToClientMessage[] {
    const reader = new ArrayBufferReader(buffer);
    const result: ServerToClientMessage[] = reader.loop(() => {
      return reader.switch<1 | 2 | 3, ServerToClientMessage>({
        1: () => ({
          type: 'joined',
          ...EntityBufferType.player.readBuffer(reader),
          serverVersion: reader.readUint16(),
        }),
        2: () => ({
          type: 'spectating',
          serverVersion: reader.readUint16(),
        }),
        3: () => ({
          type: 'worldState',
          entities: reader.loop(() => {
            const option = reader.readUint8();
            return EntityBufferType[EntityBufferValue[option]].readBuffer(reader);
          }),
        }),
      });
    });
    reader.done();
    return result;
  }
}
