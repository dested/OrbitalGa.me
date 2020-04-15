import {Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameRules, PlayerWeapon, WeaponConfigs} from '../game/gameRules';
import {Weapon} from './weapon';
import {PlayerEntity} from './playerEntity';
import {GameConstants} from '../game/gameConstants';
import {ImpliedEntityType} from '../models/entityTypeModels';

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

  static addBuffer(buff: ArrayBufferBuilder, entity: PlayerWeaponModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint32(entity.ownerEntityId);
    buff.addInt32(entity.offsetX);
    buff.addInt32(entity.startY);
    PlayerEntity.addBufferWeapon(buff, entity.weaponType);
  }

  static readBuffer(reader: ArrayBufferReader): PlayerWeaponModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'playerWeapon',
      ownerEntityId: reader.readUint32(),
      offsetX: reader.readInt32(),
      startY: reader.readInt32(),
      weaponType: PlayerEntity.readBufferWeapon(reader),
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
