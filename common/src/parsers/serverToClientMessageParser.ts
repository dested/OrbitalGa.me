import {ServerToClientMessage, WorldStateEntity} from '../models/messages';
import {unreachable} from '../utils/unreachable';
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
          break;
        case 'worldState':
          buff.addUint8(2);
          buff.addUint16(message.entities.length);
          for (const entity of message.entities) {
            this.addEntity(buff, entity);
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
      return reader.switch<1 | 2, ServerToClientMessage>({
        1: () => ({
          type: 'joined',
          x: reader.readFloat32(),
          y: reader.readFloat32(),
          entityId: reader.readUint32(),
        }),
        2: () => ({
          type: 'worldState',
          entities: reader.loop(() => this.readEntity(reader)),
        }),
      });
    });
  }

  private static addEntity(buff: ArrayBufferBuilder, entity: WorldStateEntity) {
    switch (entity.entityType) {
      case 'shot':
        buff.addUint8(1);
        buff.addFloat32(entity.x);
        buff.addFloat32(entity.y);
        buff.addFloat32(entity.shotOffsetX);
        buff.addFloat32(entity.shotOffsetY);
        buff.addUint32(entity.entityId);
        buff.addUint32(entity.ownerEntityId);
        break;
      case 'enemyShot':
        buff.addUint8(2);
        buff.addFloat32(entity.x);
        buff.addFloat32(entity.y);
        buff.addFloat32(entity.startY);
        buff.addUint32(entity.entityId);
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
        buff.addFloat32(entity.momentumX);
        buff.addFloat32(entity.momentumY);
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
      case 'shotExplosion':
        buff.addUint8(6);
        buff.addFloat32(entity.x);
        buff.addFloat32(entity.y);
        buff.addUint8(entity.aliveDuration);
        buff.addUint32(entity.entityId);
        buff.addUint32(entity.ownerEntityId);
        break;
      default:
        unreachable(entity);
    }
    buff.addBoolean(entity.create);
  }

  private static readEntity(reader: ArrayBufferReader) {
    return reader.switch<1 | 2 | 3 | 4 | 5 | 6, WorldStateEntity>({
      1: () => ({
        entityType: 'shot',
        x: reader.readFloat32(),
        y: reader.readFloat32(),
        shotOffsetX: reader.readFloat32(),
        shotOffsetY: reader.readFloat32(),
        entityId: reader.readUint32(),
        ownerEntityId: reader.readUint32(),
        create: reader.readBoolean(),
      }),
      2: () => ({
        entityType: 'enemyShot',
        x: reader.readFloat32(),
        y: reader.readFloat32(),
        startY: reader.readFloat32(),
        entityId: reader.readUint32(),
        create: reader.readBoolean(),
      }),
      3: () => ({
        entityType: 'swoopingEnemy',
        x: reader.readFloat32(),
        y: reader.readFloat32(),
        entityId: reader.readUint32(),
        health: reader.readUint8(),
        create: reader.readBoolean(),
      }),
      4: () => ({
        entityType: 'player',
        x: reader.readFloat32(),
        y: reader.readFloat32(),
        momentumX: reader.readFloat32(),
        momentumY: reader.readFloat32(),
        entityId: reader.readUint32(),
        lastProcessedInputSequenceNumber: reader.readUint32(),
        create: reader.readBoolean(),
      }),
      5: () => ({
        entityType: 'wall',
        x: reader.readFloat32(),
        y: reader.readFloat32(),
        entityId: reader.readUint32(),
        width: reader.readUint16(),
        height: reader.readUint16(),
        create: reader.readBoolean(),
      }),
      6: () => ({
        entityType: 'shotExplosion',
        x: reader.readFloat32(),
        y: reader.readFloat32(),
        aliveDuration: reader.readUint8(),
        entityId: reader.readUint32(),
        ownerEntityId: reader.readUint32(),
        create: reader.readBoolean(),
      }),
    });
  }
}
