import {Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel, EntityModelSchema} from './entity';
import {PlayerWeapon, WeaponConfigs} from '../game/gameRules';
import {Weapon} from './weapon';
import {ImpliedEntityType} from '../models/serverToClientMessages';
import {PlayerWeaponEnumSchema} from '../models/schemaEnums';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {Utils} from '../utils/utils';

export class PlayerWeaponEntity extends Entity implements Weapon {
  aliveDuration = 3000;
  boundingBoxes = [{width: 9, height: 150}];
  damage: number;
  explosionIntensity: number;
  isWeapon = true as const;
  offsetX: number;
  ownerEntityId: number;
  ownerPlayerEntityId: number;
  sprayAngle: number;
  startY: number;
  type = 'playerWeapon' as const;
  weaponSide = 'player' as const;
  weaponType: PlayerWeapon;

  constructor(game: Game, messageModel: ImpliedEntityType<PlayerWeaponModel>) {
    super(game, messageModel);
    this.ownerEntityId = messageModel.ownerEntityId;
    this.ownerPlayerEntityId = messageModel.ownerEntityId;
    this.offsetX = messageModel.offsetX;
    this.weaponType = messageModel.weaponType;
    this.startY = messageModel.startY;
    this.sprayAngle = messageModel.sprayAngle;
    this.damage = WeaponConfigs[this.weaponType].damage;
    this.explosionIntensity = WeaponConfigs[this.weaponType].explosionIntensity;
    this.createPolygon();
  }

  get realX() {
    return this.x;
  }

  get realY() {
    return this.y;
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
      this.momentumY += config.speed * (duration / 1000);
      this.y -= this.momentumY;
    } else {
      if (this.sprayAngle > 0) {
        this.x -= Math.cos(Utils.degToRad(this.sprayAngle)) * config.speed * (duration / 1000);
        this.y -= Math.sin(Utils.degToRad(this.sprayAngle)) * config.speed * (duration / 1000);
      } else {
        this.y -= config.speed * (duration / 1000);
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
    this.offsetX = messageModel.offsetX;
    this.weaponType = messageModel.weaponType;
    this.startY = messageModel.startY;
    this.sprayAngle = messageModel.sprayAngle;
  }

  serialize(): PlayerWeaponModel {
    return {
      ...super.serialize(),
      ownerEntityId: this.ownerEntityId,
      offsetX: this.offsetX,
      startY: this.startY,
      sprayAngle: this.sprayAngle,
      weaponType: this.weaponType,
      type: 'playerWeapon',
    };
  }
}

export type PlayerWeaponModel = EntityModel & {
  offsetX: number;
  ownerEntityId: number;
  sprayAngle: number;
  startY: number;
  type: 'playerWeapon';
  weaponType: PlayerWeapon;
};

export const PlayerWeaponModelSchema: SDTypeElement<PlayerWeaponModel> = {
  ...EntityModelSchema,
  weaponType: PlayerWeaponEnumSchema,
  sprayAngle: 'uint8',
  startY: 'int32',
  offsetX: 'int32',
  ownerEntityId: 'uint32',
};
