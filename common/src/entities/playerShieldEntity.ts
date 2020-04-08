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
import {GameRules} from '../game/gameRules';

export class PlayerShieldEntity extends Entity {
  boundingBoxes = [{width: 133, height: 108}];

  depleted = false;

  health = GameRules.playerShield.base.startingHealth;

  lastHit = 0;
  tickIndex = 0;

  constructor(game: Game, entityId: number, public ownerEntityId: number) {
    super(game, entityId, 'playerShield');
    this.createPolygon();
  }

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

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof EnemyShotEntity) {
      return this.hurt(1, otherEntity, this.realX - otherEntity.realX, this.realY - otherEntity.realY);
    }

    return false;
  }
  gameTick(duration: number) {
    this.tickIndex++;
    if (!this.depleted && this.health <= 0) {
      this.lastHit = GameRules.playerShield.base.depletedRegenTimeout;
      this.depleted = true;
    }
    this.lastHit--;
    if (this.lastHit <= 0 && this.health < GameRules.playerShield.base.startingHealth) {
      if (this.depleted) {
        this.depleted = false;
        this.health++;
      } else if (this.tickIndex % GameRules.playerShield.base.regenRate === 0) {
        this.health++;
      }
    }
  }

  hurt(damage: number, otherEntity: Entity, x: number, y: number) {
    if (this.depleted) {
      return false;
    }
    this.health -= damage;
    this.lastHit = 10;
    this.game.destroyEntity(otherEntity);
    const shotExplosionEntity = new ShotExplosionEntity(this.game, nextId(), 3, this.entityId);
    shotExplosionEntity.start(x, y);
    this.game.entities.push(shotExplosionEntity);

    return true;
  }
  reconcileFromServer(messageEntity: PlayerShieldModel) {
    super.reconcileFromServer(messageEntity);
    this.health = messageEntity.health;
    this.depleted = messageEntity.depleted;
    this.ownerEntityId = messageEntity.ownerEntityId;
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

  static addBuffer(buff: ArrayBufferBuilder, entity: PlayerShieldModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint8(entity.health);
    buff.addBoolean(entity.depleted);
    buff.addUint32(entity.ownerEntityId);
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
}

export type PlayerShieldModel = EntityModel & {
  depleted: boolean;
  entityType: 'playerShield';
  health: number;
  ownerEntityId: number;
};
