import {Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {ShotEntity} from './shotEntity';
import {ShotExplosionEntity} from './shotExplosionEntity';
import {nextId} from '../utils/uuid';
import {EnemyShotEntity} from './enemyShotEntity';
import {GameConstants} from '../game/gameConstants';
import {GameRules} from "../game/gameRules";

export class PlayerShieldEntity extends Entity {
  boundingBoxes = [{width: 133, height: 108}];

  get realX() {
    const owner = this.game.entities.lookup(this.ownerEntityId);
    if (!owner) {
      return this.x;
    }
    return this.x + owner.realX;
  }
  get realY() {
    const owner = this.game.entities.lookup(this.ownerEntityId);
    if (!owner) {
      return this.y;
    }
    return this.y + owner.realY;
  }

  constructor(game: Game, entityId: number, public ownerEntityId: number) {
    super(game, entityId, 'playerShield');
    this.createPolygon();
  }

  lastHit = 0;

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof EnemyShotEntity && !this.depleted) {
      this.health -= 1;
      this.lastHit = 10;
      this.game.destroyEntity(otherEntity);
      const shotExplosionEntity = new ShotExplosionEntity(this.game, nextId(), this.entityId);
      shotExplosionEntity.start(this.realX - otherEntity.realX, this.realY - otherEntity.realY);
      this.game.entities.push(shotExplosionEntity);

      return true;
    }

    return false;
  }

  health = GameRules.playerShield.base.startingHealth;
  tick = 0;

  depleted = false;
  gameTick(duration: number) {
    this.tick++;
    if (!this.depleted && this.health <= 0) {
      this.lastHit = GameRules.playerShield.base.depletedRegenTimeout;
      this.depleted = true;
    }
    this.lastHit--;
    if (this.lastHit <= 0 && this.health < GameRules.playerShield.base.startingHealth) {
      if (this.depleted) {
        this.depleted = false;
        this.health++;
      } else if (this.tick % GameRules.playerShield.base.regenRate === 0) {
        this.health++;
      }
    }
  }

  serialize(): PlayerShieldModel {
    return {
      ...super.serialize(),
      health: this.health,
      depleted: this.depleted,
      ownerEntityId: this.ownerEntityId,
      entityType: 'playerShield',
    };
  }
  reconcileFromServer(messageEntity: PlayerShieldModel) {
    super.reconcileFromServer(messageEntity);
    this.health = messageEntity.health;
    this.depleted = messageEntity.depleted;
    this.ownerEntityId = messageEntity.ownerEntityId;
  }

  static readBuffer(reader: ArrayBufferReader): PlayerShieldModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'playerShield',
      health: reader.readUint8(),
      depleted: reader.readBoolean(),
      ownerEntityId: reader.readUint32(),
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: PlayerShieldModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint8(entity.health);
    buff.addBoolean(entity.depleted);
    buff.addUint32(entity.ownerEntityId);
  }
}

export type PlayerShieldModel = EntityModel & {
  entityType: 'playerShield';
  health: number;
  depleted: boolean;
  ownerEntityId: number;
};
