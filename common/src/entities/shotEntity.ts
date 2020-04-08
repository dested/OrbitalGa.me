import {Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameRules} from '../game/gameRules';
import {MeteorModel} from './meteorEntity';

export class ShotEntity extends Entity {
  aliveDuration = 3000;
  boundingBoxes = [{width: 9, height: 57}];

  constructor(game: Game, entityId: number, public ownerEntityId: number, public startY: number) {
    super(game, entityId, 'shot');
    this.createPolygon();
  }

  get realX() {
    return this.x;
  }
  get realY() {
    return this.y;
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof WallEntity) {
      this.game.destroyEntity(this);
      return true;
    }
    return false;
  }

  gameTick(duration: number) {
    this.y -= GameRules.playerShots.base.shotSpeedPerSecond * (duration / 1000);
    this.aliveDuration -= duration;
    if (this.aliveDuration <= 0) {
      this.game.destroyEntity(this);
    }
  }

  reconcileFromServer(messageEntity: ShotEntity) {
    super.reconcileFromServer(messageEntity);
    this.ownerEntityId = messageEntity.ownerEntityId;
    this.startY = messageEntity.startY;
  }

  serialize(): ShotModel {
    return {
      ...super.serialize(),
      ownerEntityId: this.ownerEntityId,
      startY: this.startY,
      entityType: 'shot',
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: ShotModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint32(entity.ownerEntityId);
    buff.addInt32(entity.startY);
  }

  static readBuffer(reader: ArrayBufferReader): ShotModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'shot',
      ownerEntityId: reader.readUint32(),
      startY: reader.readInt32(),
    };
  }
}

export type ShotModel = EntityModel & {
  entityType: 'shot';
  ownerEntityId: number;
  startY: number;
};
