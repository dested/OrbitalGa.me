import {Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel, EntityModelSchema} from './entity';
import {PlayerWeapon, WeaponConfigs} from '../game/gameRules';
import {Weapon} from './weapon';
import {ImpliedEntityType} from '../models/entityTypeModels';
import {EntitySizeByType} from '../parsers/arrayBufferSchema';
import {PlayerWeaponEnumSchema} from '../models/enums';

export class PlayerWeaponEntity extends Entity implements Weapon {
  aliveDuration = 3000;
  boundingBoxes = [{width: 9, height: 57}];
  damage: number;
  entityType = 'playerWeapon' as const;
  explosionIntensity: number;
  isWeapon = true as const;
  offsetX: number;
  ownerEntityId: number;
  startY: number;
  weaponSide = 'player' as const;
  weaponType: PlayerWeapon;

  constructor(game: Game, messageModel: ImpliedEntityType<PlayerWeaponModel>) {
    super(game, messageModel);
    this.ownerEntityId = messageModel.ownerEntityId;
    this.startY = messageModel.startY;
    this.offsetX = messageModel.offsetX;
    this.weaponType = messageModel.weaponType;
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
    this.game.gameLeaderboard.increaseEntry(this.ownerEntityId, 'damageGiven', damage);
  }

  causedKill(otherEntity: Entity): void {
    this.game.gameLeaderboard.increaseEntry(this.ownerEntityId, 'enemiesKilled', 1);
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
      this.y -= config.speed * (duration / 1000);
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
    this.startY = messageModel.startY;
    this.offsetX = messageModel.offsetX;
    this.weaponType = messageModel.weaponType;
  }

  serialize(): PlayerWeaponModel {
    return {
      ...super.serialize(),
      ownerEntityId: this.ownerEntityId,
      offsetX: this.offsetX,
      startY: this.startY,
      weaponType: this.weaponType,
      entityType: 'playerWeapon',
    };
  }
}

export type PlayerWeaponModel = EntityModel & {
  entityType: 'playerWeapon';
  offsetX: number;
  ownerEntityId: number;
  startY: number;
  weaponType: PlayerWeapon;
};

export const PlayerWeaponModelSchema: EntitySizeByType<PlayerWeaponModel, PlayerWeaponModel['entityType']> = {
  entityType: 11,
  ...EntityModelSchema,
  weaponType: PlayerWeaponEnumSchema,
  startY: 'int32',
  offsetX: 'int32',
  ownerEntityId: 'uint32',
};
