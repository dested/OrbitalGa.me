import {Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameRules, PlayerWeapon, WeaponConfigs} from '../game/gameRules';
import {Weapon} from './weapon';
import {PlayerEntity} from './playerEntity';
import {GameConstants} from '../game/gameConstants';

export class PlayerWeaponEntity extends Entity implements Weapon {
  aliveDuration = 3000;
  boundingBoxes = [{width: 9, height: 57}];
  damage: number;
  explosionIntensity: number;
  isWeapon = true as const;
  weaponSide = 'player' as const;

  constructor(
    game: Game,
    entityId: number,
    x: number,
    y: number,
    public ownerEntityId: number,
    public offsetX: number,
    public startY: number,
    public weaponType: PlayerWeapon
  ) {
    super(game, entityId, 'playerWeapon');
    this.x = x;
    this.y = y;
    this.damage = WeaponConfigs[weaponType].damage;
    this.explosionIntensity = WeaponConfigs[weaponType].explosionIntensity;
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

  reconcileFromServer(messageModel: ShotModel) {
    super.reconcileFromServer(messageModel);
    this.ownerEntityId = messageModel.ownerEntityId;
    this.startY = messageModel.startY;
    this.offsetX = messageModel.offsetX;
    this.weaponType = messageModel.weaponType;
  }

  serialize(): ShotModel {
    return {
      ...super.serialize(),
      ownerEntityId: this.ownerEntityId,
      offsetX: this.offsetX,
      startY: this.startY,
      weaponType: this.weaponType,
      entityType: 'playerWeapon',
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: ShotModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint32(entity.ownerEntityId);
    buff.addInt32(entity.offsetX);
    buff.addInt32(entity.startY);
    PlayerEntity.addBufferWeapon(buff, entity.weaponType);
  }

  static readBuffer(reader: ArrayBufferReader): ShotModel {
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

export type ShotModel = EntityModel & {
  entityType: 'playerWeapon';
  offsetX: number;
  ownerEntityId: number;
  startY: number;
  weaponType: PlayerWeapon;
};
