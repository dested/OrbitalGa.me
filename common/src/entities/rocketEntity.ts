import {Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameRules} from '../game/gameRules';
import {Weapon} from './weapon';

export class RocketEntity extends Entity implements Weapon {
  aliveDuration = 3000;
  boundingBoxes = [{width: 9, height: 57}];
  damage = 4;
  explosionIntensity = 5;
  isWeapon = true as const;
  weaponSide = 'player' as const;

  constructor(
    game: Game,
    entityId: number,
    public ownerEntityId: number,
    public offsetX: number,
    public startY: number
  ) {
    super(game, entityId, 'rocket');
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
      this.game.explode(this, 'small');
      return true;
    }
    return false;
  }

  gameTick(duration: number) {
    this.y -= GameRules.playerRockets.base.rocketSpeedPerSecond * (duration / 1000);
    this.aliveDuration -= duration;
    if (this.aliveDuration <= 0) {
      this.destroy();
    }
  }

  hurt(damage: number, otherEntity: Entity, overlapX: number, overlap: number): void {
    this.destroy();
  }

  reconcileFromServer(messageModel: RocketModel) {
    super.reconcileFromServer(messageModel);
    this.ownerEntityId = messageModel.ownerEntityId;
    this.startY = messageModel.startY;
    this.offsetX = messageModel.offsetX;
  }

  serialize(): RocketModel {
    return {
      ...super.serialize(),
      ownerEntityId: this.ownerEntityId,
      offsetX: this.offsetX,
      startY: this.startY,
      entityType: 'rocket',
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: RocketModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint32(entity.ownerEntityId);
    buff.addInt32(entity.offsetX);
    buff.addInt32(entity.startY);
  }

  static readBuffer(reader: ArrayBufferReader): RocketModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'rocket',
      ownerEntityId: reader.readUint32(),
      offsetX: reader.readInt32(),
      startY: reader.readInt32(),
    };
  }
}

export type RocketModel = EntityModel & {
  entityType: 'rocket';
  offsetX: number;
  ownerEntityId: number;
  startY: number;
};
