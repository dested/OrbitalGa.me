import {Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';

export class EnemyShotEntity extends Entity {
  get realX() {
    return this.x;
  }
  get realY() {
    return this.y;
  }

  boundingBoxes = [{width: 9, height: 57}];

  constructor(game: Game, entityId: number, startY: number) {
    super(game, entityId, 'enemyShot');
    this.createPolygon();
    this.startY = startY;
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof WallEntity) {
      this.game.destroyEntity(this);
      return true;
    }
    return false;
  }

  shotSpeedPerSecond = 900;
  startY: number;
  aliveDuration = 3000;

  gameTick(duration: number) {
    this.y += this.shotSpeedPerSecond * (duration / 1000);
    this.aliveDuration -= duration;
    if (this.aliveDuration <= 0) {
      this.game.destroyEntity(this);
    }
  }

  serialize(): EnemyShotModel {
    return {
      ...super.serialize(),
      startY: this.startY,
      entityType: 'enemyShot',
    };
  }

  static readBuffer(reader: ArrayBufferReader): EnemyShotModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'enemyShot',
      startY: reader.readFloat32(),
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: EnemyShotModel) {
    Entity.addBuffer(buff, entity);
    buff.addFloat32(entity.startY);
  }
}

export type EnemyShotModel = EntityModel & {
  entityType: 'enemyShot';
  startY: number;
};
