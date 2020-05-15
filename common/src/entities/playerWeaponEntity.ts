import {Result} from 'collisions';
import {OrbitalGame} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity} from '../baseEntities/entity';
import {PlayerWeapon, WeaponConfigs} from '../game/gameRules';
import {ImpliedEntityType} from '../models/serverToClientMessages';
import {PlayerWeaponEnumSchema} from '../models/schemaEnums';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {
  ImpliedDefaultPhysics,
  PhysicsEntity,
  PhysicsEntityModel,
  PhysicsEntityModelSchema,
} from '../baseEntities/physicsEntity';
import {ShadowableEntity, ShadowEntityModel, ShadowEntityModelSchema} from '../baseEntities/shadowableEntity';
import {WeaponEntity} from './weaponEntity';

export class PlayerWeaponEntity extends PhysicsEntity implements WeaponEntity, ShadowableEntity {
  aliveDuration = 3000;
  boundingBoxes = [{width: 9, height: 28}];
  damage: number;
  explosionIntensity: number;
  inputId: number;
  isWeapon = true as const;
  ownerEntityId: number;
  ownerPlayerEntityId: number;
  sprayAngle: number;
  tickCreated: number = 0;
  type = 'playerWeapon' as const;
  weaponSide = 'player' as const;
  weaponType: PlayerWeapon;

  constructor(public game: OrbitalGame, messageModel: ImpliedEntityType<ImpliedDefaultPhysics<PlayerWeaponModel>>) {
    super(game, messageModel);
    this.ownerEntityId = messageModel.ownerEntityId;
    this.ownerPlayerEntityId = messageModel.ownerEntityId;
    this.weaponType = messageModel.weaponType;
    this.sprayAngle = messageModel.sprayAngle;
    this.inputId = messageModel.inputId;
    this.damage = WeaponConfigs[this.weaponType].damage;
    this.explosionIntensity = WeaponConfigs[this.weaponType].explosionIntensity;
    const config = WeaponConfigs[this.weaponType];
    if (!config.rampUp) {
      this.velocity.add({x: 0, y: -config.speed});
    }
    this.createPolygon();
  }

  get shadowEntity() {
    return this.entityId > 1000000;
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
                missile.velocity.x += Math.cos(missile.angle * (Math.PI / 180)) * 10;
        missile.velocity.y += Math.sin(missile.angle * (Math.PI / 180)) * 10;

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
    this.inputId = messageModel.inputId;
    this.weaponType = messageModel.weaponType;
    this.sprayAngle = messageModel.sprayAngle;
  }

  serialize(): PlayerWeaponModel {
    return {
      ...super.serialize(),
      inputId: this.inputId,
      ownerEntityId: this.ownerEntityId,
      sprayAngle: this.sprayAngle,
      weaponType: this.weaponType,
      type: 'playerWeapon',
    };
  }
}

export type PlayerWeaponModel = PhysicsEntityModel &
  ShadowEntityModel & {
    ownerEntityId: number;
    sprayAngle: number;
    type: 'playerWeapon';
    weaponType: PlayerWeapon;
  };

export const PlayerWeaponModelSchema: SDTypeElement<PlayerWeaponModel> = {
  ...PhysicsEntityModelSchema,
  ...ShadowEntityModelSchema,
  weaponType: PlayerWeaponEnumSchema,
  sprayAngle: 'uint8',
  ownerEntityId: 'uint32',
};
