import {Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameRules} from '../game/gameRules';
import {Weapon} from './weapon';

export class EnemyShotEntity extends Entity implements Weapon {
  aliveDuration = 3000;
  boundingBoxes = [{width: 9, height: 57}];
  damage = 1;
  explosionIntensity = 2;
  isWeapon = true as const;
  weaponSide = 'enemy' as const;

  constructor(game: Game, entityId: number) {
    super(game, entityId, 'enemyShot');
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
      this.destroy();
      return true;
    }
    return false;
  }

  gameTick(duration: number) {
    this.y += GameRules.enemyShots.base.shotSpeedPerSecond * (duration / 1000);
    this.aliveDuration -= duration;
    if (this.aliveDuration <= 0) {
      this.destroy();
    }
  }
  hurt(damage: number, otherEntity: Entity, overlapX: number, overlap: number): void {
    this.destroy();
  }

  serialize(): EnemyShotModel {
    return {
      ...super.serialize(),
      entityType: 'enemyShot',
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: EnemyShotModel) {
    Entity.addBuffer(buff, entity);
  }

  static readBuffer(reader: ArrayBufferReader): EnemyShotModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'enemyShot',
    };
  }
}

export type EnemyShotModel = EntityModel & {
  entityType: 'enemyShot';
};
