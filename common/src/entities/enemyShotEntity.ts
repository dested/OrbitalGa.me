import {Result} from 'collisions';
import {OrbitalGame} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity} from '../baseEntities/entity';
import {GameRules} from '../game/gameRules';
import {isNeutralWeapon, isPlayerWeapon, WeaponEntity} from './weaponEntity';
import {ImpliedEntityType} from '../models/serverToClientMessages';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {
  ImpliedDefaultPhysics,
  PhysicsEntity,
  PhysicsEntityModel,
  PhysicsEntityModelSchema,
} from '../baseEntities/physicsEntity';

export class EnemyShotEntity extends PhysicsEntity implements WeaponEntity {
  aliveDuration = 3000;
  boundingBoxes = [{width: 9, height: 100}];
  damage = 1;
  explosionIntensity = 2;
  isWeapon = true as const;
  ownerEntityId: number;
  ownerPlayerEntityId: number;
  type = 'enemyShot' as const;
  weaponSide = 'enemy' as const;
  mass = 1;

  constructor(public game: OrbitalGame, messageModel: ImpliedEntityType<ImpliedDefaultPhysics<EnemyShotModel>>) {
    super(game, messageModel);
    this.ownerEntityId = messageModel.ownerEntityId;
    this.ownerPlayerEntityId = messageModel.ownerEntityId;
    this.createPolygon();
    this.velocity.set(0, GameRules.enemyShots.base.shotSpeedPerSecond);
  }

  causedDamage(damage: number, otherEntity: Entity): void {}
  causedKill(otherEntity: Entity): void {}

  collide(otherEntity: PhysicsEntity, collisionResult: Result): void {
    this.destroy();
  }

  shouldIgnoreCollision(otherEntity: PhysicsEntity): boolean {
    return otherEntity.type === 'swoopingEnemy';
  }

  gameTick(duration: number) {
    this.aliveDuration -= duration;
    if (this.aliveDuration <= 0) {
      this.destroy();
    }
  }
  hurt(damage: number): void {
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
