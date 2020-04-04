import {ServerToClientMessage, WorldStateEntity} from '../models/messages';
import {unreachable} from '../utils/unreachable';
import {ArrayBufferBuilder, ArrayBufferReader} from './arrayBufferBuilder';
import {ShotEntity} from '../entities/shotEntity';
import {EnemyShotEntity} from '../entities/enemyShotEntity';
import {SwoopingEnemyEntity} from '../entities/swoopingEnemyEntity';
import {PlayerEntity} from '../entities/playerEntity';
import {WallEntity} from '../entities/wallEntity';
import {ShotExplosionEntity} from '../entities/shotExplosionEntity';
import {EntityModelType} from '../../../client/src/game/entities/entityTypeModels';

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
      return reader.switch<1 | 2, ServerToClientMessage>({
        1: () => ({
          type: 'joined',
          x: reader.readFloat32(),
          y: reader.readFloat32(),
          entityId: reader.readUint32(),
        }),
        2: () => ({
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

const EntityBufferType: {
  [key in WorldStateEntity['entityType']]: {
    value: number;
    addBuffer: (buff: ArrayBufferBuilder, entityModel: EntityModelType[key]) => void;
    readBuffer: (reader: ArrayBufferReader) => EntityModelType[key];
  };
} = {
  player: {value: 1, addBuffer: PlayerEntity.addBuffer, readBuffer: PlayerEntity.readBuffer},
  enemyShot: {value: 2, addBuffer: EnemyShotEntity.addBuffer, readBuffer: EnemyShotEntity.readBuffer},
  shot: {value: 3, addBuffer: ShotEntity.addBuffer, readBuffer: ShotEntity.readBuffer},
  shotExplosion: {value: 4, addBuffer: ShotExplosionEntity.addBuffer, readBuffer: ShotExplosionEntity.readBuffer},
  swoopingEnemy: {value: 5, addBuffer: SwoopingEnemyEntity.addBuffer, readBuffer: SwoopingEnemyEntity.readBuffer},
  wall: {value: 6, addBuffer: WallEntity.addBuffer, readBuffer: WallEntity.readBuffer},
};

const EntityBufferValue: {
  [key: number]: WorldStateEntity['entityType'];
} = {
  1: 'player',
  2: 'enemyShot',
  3: 'shot',
  4: 'shotExplosion',
  5: 'swoopingEnemy',
  6: 'wall',
};
