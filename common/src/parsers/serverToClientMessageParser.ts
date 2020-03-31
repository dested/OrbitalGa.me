import {ServerToClientCreateEntity, ServerToClientMessage, WorldStateEntity} from '../models/messages';
import {unreachable} from '../utils/unreachable';
import {Utils} from '../utils/utils';
import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';

export class ServerToClientMessageParser {
  static fromServerToClientMessages(messages: ServerToClientMessage[]) {
    const buff = new ArrayBufferBuilder();
    buff.addUint16(messages.length);
    for (const message of messages) {
      switch (message.type) {
        case 'joined':
          buff.addUint8(1);
          buff.addFloat32(message.x);
          buff.addFloat32(message.y);
          buff.addUint32(message.entityId);
          buff.addString(message.clientId);
          break;
        case 'createEntity':
          buff.addUint8(2);
          switch (message.entityType) {
            case 'shot':
              buff.addUint8(1);
              buff.addFloat32(message.x);
              buff.addFloat32(message.y);
              buff.addUint32(message.entityId);
              break;
            case 'enemyShot':
              buff.addUint8(2);
              buff.addFloat32(message.x);
              buff.addFloat32(message.y);
              buff.addUint32(message.entityId);
              break;
            case 'swoopingEnemy':
              buff.addUint8(3);
              buff.addFloat32(message.x);
              buff.addFloat32(message.y);
              buff.addUint32(message.entityId);
              buff.addUint8(message.health);
              break;
            default:
              unreachable(message);
          }
          break;
        case 'worldState':
          buff.addUint8(3);
          buff.addUint16(message.entities.length);
          for (const entity of message.entities) {
            switch (entity.type) {
              case 'shot':
                buff.addUint8(1);
                buff.addFloat32(entity.x);
                buff.addFloat32(entity.y);
                buff.addUint32(entity.entityId);
                buff.addBoolean(entity.markToDestroy);
                break;
              case 'enemyShot':
                buff.addUint8(2);
                buff.addFloat32(entity.x);
                buff.addFloat32(entity.y);
                buff.addUint32(entity.entityId);
                buff.addBoolean(entity.markToDestroy);
                break;
              case 'swoopingEnemy':
                buff.addUint8(3);
                buff.addFloat32(entity.x);
                buff.addFloat32(entity.y);
                buff.addUint32(entity.entityId);
                buff.addUint8(entity.health);
                break;
              case 'player':
                buff.addUint8(4);
                buff.addFloat32(entity.x);
                buff.addFloat32(entity.y);
                buff.addUint32(entity.entityId);
                buff.addUint32(entity.lastProcessedInputSequenceNumber);
                break;
              case 'wall':
                buff.addUint8(5);
                buff.addFloat32(entity.x);
                buff.addFloat32(entity.y);
                buff.addUint32(entity.entityId);
                buff.addUint16(entity.width);
                buff.addUint16(entity.height);
                break;
              default:
                unreachable(entity);
            }
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
    return reader.loop(() => {
      return reader.switch<1 | 2 | 3, ServerToClientMessage>({
        1: () => ({
          type: 'joined',
          x: reader.readFloat32(),
          y: reader.readFloat32(),
          entityId: reader.readUint32(),
          clientId: reader.readString(),
        }),
        2: () =>
          reader.switch<1 | 2 | 3, ServerToClientCreateEntity>({
            1: () => ({
              type: 'createEntity',
              entityType: 'shot',

              x: reader.readFloat32(),
              y: reader.readFloat32(),
              entityId: reader.readUint32(),
            }),
            2: () => ({
              type: 'createEntity',
              entityType: 'enemyShot',
              x: reader.readFloat32(),
              y: reader.readFloat32(),
              entityId: reader.readUint32(),
            }),
            3: () => ({
              type: 'createEntity',
              entityType: 'swoopingEnemy',
              x: reader.readFloat32(),
              y: reader.readFloat32(),
              entityId: reader.readUint32(),
              health: reader.readUint8(),
            }),
          }),
        3: () => ({
          type: 'worldState',
          entities: reader.loop(() =>
            reader.switch<1 | 2 | 3 | 4 | 5, WorldStateEntity>({
              1: () => ({
                type: 'shot',
                x: reader.readFloat32(),
                y: reader.readFloat32(),
                entityId: reader.readUint32(),
                markToDestroy: reader.readBoolean(),
              }),
              2: () => ({
                type: 'enemyShot',
                x: reader.readFloat32(),
                y: reader.readFloat32(),
                entityId: reader.readUint32(),
                markToDestroy: reader.readBoolean(),
              }),
              3: () => ({
                type: 'swoopingEnemy',
                x: reader.readFloat32(),
                y: reader.readFloat32(),
                entityId: reader.readUint32(),
                health: reader.readUint8(),
              }),
              4: () => ({
                type: 'player',
                x: reader.readFloat32(),
                y: reader.readFloat32(),
                entityId: reader.readUint32(),
                lastProcessedInputSequenceNumber: reader.readUint32(),
              }),
              5: () => ({
                type: 'wall',
                x: reader.readFloat32(),
                y: reader.readFloat32(),
                entityId: reader.readUint32(),
                width: reader.readUint16(),
                height: reader.readUint16(),
              }),
            })
          ),
        }),
      });
    });
  }
}
