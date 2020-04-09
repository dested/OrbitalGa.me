import {Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameRules} from '../game/gameRules';
import {Weapon} from './weapon';

export class ShotEntity extends Entity implements Weapon {
  aliveDuration = 3000;
  boundingBoxes = [{width: 9, height: 57}];
  damage = 1;
  explosionIntensity = 1;
  isWeapon = true as const;
  weaponSide = 'player' as const;

  constructor(
    game: Game,
    entityId: number,
    public ownerEntityId: number,
    public offsetX: number,
    public startY: number
  ) {
    super(game, entityId, 'shot');
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
    this.y -= GameRules.playerShots.base.shotSpeedPerSecond * (duration / 1000);
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
  }

  serialize(): ShotModel {
    return {
      ...super.serialize(),
      ownerEntityId: this.ownerEntityId,
      offsetX: this.offsetX,
      startY: this.startY,
      entityType: 'shot',
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: ShotModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint32(entity.ownerEntityId);
    buff.addInt32(entity.offsetX);
    buff.addInt32(entity.startY);
  }

  static readBuffer(reader: ArrayBufferReader): ShotModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'shot',
      ownerEntityId: reader.readUint32(),
      offsetX: reader.readInt32(),
      startY: reader.readInt32(),
    };
  }
}

export type ShotModel = EntityModel & {
  entityType: 'shot';
  offsetX: number;
  ownerEntityId: number;
  startY: number;
};
