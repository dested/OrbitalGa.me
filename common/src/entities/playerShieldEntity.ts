import {Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';

export class PlayerShieldEntity extends Entity {
  get realX() {
    return this.x + (this.game.entities.lookup(this.ownerEntityId)?.x ?? 0);
  }
  get realY() {
    return this.y + (this.game.entities.lookup(this.ownerEntityId)?.y ?? 0);
  }

  constructor(game: Game, entityId: number, public ownerEntityId: number) {
    super(game, entityId, 'playerShield');
    this.createPolygon();
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    return false;
  }

  static startingHealth = 10;
  health = PlayerShieldEntity.startingHealth;
  gameTick(duration: number) {}
  serialize(): PlayerShieldModel {
    return {
      ...super.serialize(),
      realX: this.realX,
      realY: this.realY,
      health: this.health,
      ownerEntityId: this.ownerEntityId,
      entityType: 'playerShield',
    };
  }
  reconcileFromServer(messageEntity: PlayerShieldModel) {
    super.reconcileFromServer(messageEntity);
    this.health = messageEntity.health;
    this.ownerEntityId = messageEntity.ownerEntityId;
  }

  static readBuffer(reader: ArrayBufferReader): PlayerShieldModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'playerShield',
      health: reader.readUint8(),
      ownerEntityId: reader.readUint32(),
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: PlayerShieldModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint8(entity.health);
    buff.addUint32(entity.ownerEntityId);
  }
}

export type PlayerShieldModel = EntityModel & {
  entityType: 'playerShield';
  health: number;
  ownerEntityId: number;
};
