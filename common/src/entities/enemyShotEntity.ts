import {Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel, EntityModelSchema} from './entity';
import {GameRules} from '../game/gameRules';
import {Weapon} from './weapon';
import {ImpliedEntityType} from '../models/entityTypeModels';
import {EntityModelSchemaType} from '../models/serverToClientMessages';

export class EnemyShotEntity extends Entity implements Weapon {
  aliveDuration = 3000;
  boundingBoxes = [{width: 9, height: 57}];
  damage = 1;
  type = 'enemyShot' as const;
  explosionIntensity = 2;
  isWeapon = true as const;
  weaponSide = 'enemy' as const;

  constructor(game: Game, messageModel: ImpliedEntityType<EnemyShotModel>) {
    super(game, messageModel);
    this.createPolygon();
  }

  get realX() {
    return this.x;
  }

  get realY() {
    return this.y;
  }

  causedDamage(damage: number, otherEntity: Entity): void {}
  causedKill(otherEntity: Entity): void {}

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
      type: 'enemyShot',
    };
  }
}

export type EnemyShotModel = EntityModel & {
  type: 'enemyShot';
};

export const EnemyShotModelSchema: EntityModelSchemaType<'enemyShot'> = {
  ...EntityModelSchema,
};
