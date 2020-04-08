import {Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameRules} from '../game/gameRules';

export class EnemyShotEntity extends Entity {
  aliveDuration = 3000;

  boundingBoxes = [{width: 9, height: 57}];

  constructor(game: Game, entityId: number, public ownerEntityId: number) {
    super(game, entityId, 'enemyShot');
    this.createPolygon();
  }
  get realX() {
    const owner = this.game.entities.lookup(this.ownerEntityId);
    if (!owner) {
      return this.x;
    }
    return this.x + owner.realX;
  }
  get realY() {
    const owner = this.game.entities.lookup(this.ownerEntityId);
    if (!owner) {
      return this.y;
    }
    return this.y + owner.realY;
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof WallEntity) {
      this.game.destroyEntity(this);
      return true;
    }
    return false;
  }

  gameTick(duration: number) {
    this.y += GameRules.enemyShots.base.shotSpeedPerSecond * (duration / 1000);
    this.aliveDuration -= duration;
    if (this.aliveDuration <= 0) {
      this.game.destroyEntity(this);
    }
  }

  serialize(): EnemyShotModel {
    return {
      ...super.serialize(),
      entityType: 'enemyShot',
      ownerEntityId: this.ownerEntityId,
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: EnemyShotModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint32(entity.ownerEntityId);
  }

  static readBuffer(reader: ArrayBufferReader): EnemyShotModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'enemyShot',
      ownerEntityId: reader.readUint32(),
    };
  }
}

export type EnemyShotModel = EntityModel & {
  entityType: 'enemyShot';
  ownerEntityId: number;
};
