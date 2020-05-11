import {Result} from 'collisions';
import {Game, OrbitalGame} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel, EntityModelSchema} from '../baseEntities/entity';
import {GameRules} from '../game/gameRules';
import {Weapon} from './weapon';
import {ImpliedEntityType} from '../models/serverToClientMessages';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {
  ImpliedDefaultPhysics,
  PhysicsEntity,
  PhysicsEntityModel,
  PhysicsEntityModelSchema,
} from '../baseEntities/physicsEntity';

export class EnemyShotEntity extends PhysicsEntity implements Weapon {
  aliveDuration = 3000;
  boundingBoxes = [{width: 9, height: 100}];
  damage = 1;
  explosionIntensity = 2;
  isWeapon = true as const;
  ownerEntityId: number;
  ownerPlayerEntityId: number;
  type = 'enemyShot' as const;
  weaponSide = 'enemy' as const;

  constructor(public game: OrbitalGame, messageModel: ImpliedEntityType<ImpliedDefaultPhysics<EnemyShotModel>>) {
    super(game, messageModel);
    this.ownerEntityId = messageModel.ownerEntityId;
    this.ownerPlayerEntityId = messageModel.ownerEntityId;
    this.createPolygon();
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
      ownerEntityId: this.ownerEntityId,
    };
  }
}

export type EnemyShotModel = PhysicsEntityModel & {
  ownerEntityId: number;
  type: 'enemyShot';
};

export const EnemyShotModelSchema: SDTypeElement<EnemyShotModel> = {
  ...PhysicsEntityModelSchema,
  ownerEntityId: 'uint32',
};
