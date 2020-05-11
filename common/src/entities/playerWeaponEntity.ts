import {Result} from 'collisions';
import {Game, OrbitalGame} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel, EntityModelSchema} from '../baseEntities/entity';
import {PlayerWeapon, WeaponConfigs} from '../game/gameRules';
import {Weapon} from './weapon';
import {ImpliedEntityType} from '../models/serverToClientMessages';
import {PlayerWeaponEnumSchema} from '../models/schemaEnums';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {Utils} from '../utils/utils';
import {
  ImpliedDefaultPhysics,
  PhysicsEntity,
  PhysicsEntityModel,
  PhysicsEntityModelSchema,
} from '../baseEntities/physicsEntity';

export class PlayerWeaponEntity extends PhysicsEntity implements Weapon {
  aliveDuration = 3000;
  boundingBoxes = [{width: 9, height: 28}];
  damage: number;
  explosionIntensity: number;
  isWeapon = true as const;
  ownerEntityId: number;
  ownerPlayerEntityId: number;
  sprayAngle: number;
  type = 'playerWeapon' as const;
  weaponSide = 'player' as const;
  weaponType: PlayerWeapon;

  constructor(public game: OrbitalGame, messageModel: ImpliedEntityType<ImpliedDefaultPhysics<PlayerWeaponModel>>) {
    super(game, messageModel);
    this.ownerEntityId = messageModel.ownerEntityId;
    this.ownerPlayerEntityId = messageModel.ownerEntityId;
    this.weaponType = messageModel.weaponType;
    this.sprayAngle = messageModel.sprayAngle;
    this.damage = WeaponConfigs[this.weaponType].damage;
    this.explosionIntensity = WeaponConfigs[this.weaponType].explosionIntensity;
    const config = WeaponConfigs[this.weaponType];
    if (!config.rampUp) {
      this.velocity.add({x: 0, y: -config.speed});
    }
    this.createPolygon();
  }

  causedDamage(damage: number, otherEntity: Entity): void {
    this.game.gameLeaderboard?.increaseEntry(this.ownerEntityId, 'damageGiven', damage);
  }

  causedKill(otherEntity: Entity): void {
    this.game.gameLeaderboard?.increaseEntry(this.ownerEntityId, 'enemiesKilled', 1);
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof WallEntity) {
      this.destroy();
      return true;
    }
    return false;
  }

  gameTick(duration: number) {
    const config = WeaponConfigs[this.weaponType];
    if (config.rampUp) {
      this.velocity.add({x: 0, y: -config.speed * (duration / 1000)});
    } else {
      if (this.sprayAngle > 0) {
        /* todo angular momentum   
     this.x -= Math.cos(Utils.degToRad(this.sprayAngle)) * config.speed * (duration / 1000);
        this.y -= Math.sin(Utils.degToRad(this.sprayAngle)) * config.speed * (duration / 1000);*/
      }
    }
    this.aliveDuration -= duration;
    if (this.aliveDuration <= 0) {
      this.destroy();
    }
  }

  hurt(damage: number, otherEntity: Entity, overlapX: number, overlap: number): void {
    this.destroy();
  }

  reconcileFromServer(messageModel: PlayerWeaponModel) {
    super.reconcileFromServer(messageModel);
    this.ownerEntityId = messageModel.ownerEntityId;
    this.weaponType = messageModel.weaponType;
    this.sprayAngle = messageModel.sprayAngle;
  }

  serialize(): PlayerWeaponModel {
    return {
      ...super.serialize(),
      ownerEntityId: this.ownerEntityId,
      sprayAngle: this.sprayAngle,
      weaponType: this.weaponType,
      type: 'playerWeapon',
    };
  }
}

export type PlayerWeaponModel = PhysicsEntityModel & {
  ownerEntityId: number;
  sprayAngle: number;
  type: 'playerWeapon';
  weaponType: PlayerWeapon;
};

export const PlayerWeaponModelSchema: SDTypeElement<PlayerWeaponModel> = {
  ...PhysicsEntityModelSchema,
  weaponType: PlayerWeaponEnumSchema,
  sprayAngle: 'uint8',
  ownerEntityId: 'uint32',
};
