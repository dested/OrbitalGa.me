import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {ExplosionEntity} from './explosionEntity';
import {nextId} from '../utils/uuid';
import {GameRules} from '../game/gameRules';
import {PlayerEntity} from './playerEntity';
import {Utils} from '../utils/utils';

export type ShieldStrength = 'small' | 'medium' | 'big';

export class PlayerShieldEntity extends Entity {
  boundingBoxes = [];
  depleted = false;
  health: number;
  lastHit = 0;
  shieldStrength: ShieldStrength;
  tickIndex = 0;

  constructor(game: Game, entityId: number, public ownerEntityId: number, shieldStrength: ShieldStrength) {
    super(game, entityId, 'playerShield');
    this.shieldStrength = shieldStrength;
    this.health = this.shieldConfig.maxHealth;
    this.createPolygon();
  }

  get player() {
    return this.game.entities.lookup<PlayerEntity>(this.ownerEntityId);
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

  get shieldConfig() {
    return GameRules.playerShield[this.shieldStrength];
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    return false;
  }

  gameTick(duration: number) {
    this.tickIndex++;
    if (!this.depleted && this.health <= 0) {
      if (this.shieldStrength === 'small') {
        this.lastHit = this.shieldConfig.depletedRegenTimeout;
        this.depleted = true;
      } else {
        this.shieldStrength = 'small';
      }
    }
    this.lastHit--;
    if (this.lastHit <= 0 && this.health < this.shieldConfig.maxHealth) {
      if (this.depleted) {
        this.depleted = false;
        this.health++;
      } else if (this.tickIndex % this.shieldConfig.regenRate === 0) {
        this.health++;
      }
    }
  }

  hurt(damage: number, otherEntity: Entity, x: number, y: number) {
    let damageLeft = 0;
    if (damage > this.health) {
      damageLeft = damage - this.health;
      this.health = 0;
    } else {
      this.health -= damage;
    }
    this.lastHit = 10;
    const explosionEntity = new ExplosionEntity(this.game, nextId(), 3, this.entityId);
    explosionEntity.start(x, y);
    this.game.entities.push(explosionEntity);
    return damageLeft;
  }

  reconcileFromServer(messageModel: PlayerShieldModel) {
    super.reconcileFromServer(messageModel);
    this.health = messageModel.health;
    this.depleted = messageModel.depleted;
    this.ownerEntityId = messageModel.ownerEntityId;
    this.shieldStrength = messageModel.shieldStrength;
  }

  serialize(): PlayerShieldModel {
    return {
      ...super.serialize(),
      health: this.health,
      depleted: this.depleted,
      ownerEntityId: this.ownerEntityId,
      shieldStrength: this.shieldStrength,
      entityType: 'playerShield',
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: PlayerShieldModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint8(entity.health);
    buff.addBoolean(entity.depleted);
    buff.addUint32(entity.ownerEntityId);
    buff.addSwitch(entity.shieldStrength, {
      small: 1,
      medium: 2,
      big: 3,
    });
  }

  static readBuffer(reader: ArrayBufferReader): PlayerShieldModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'playerShield',
      health: reader.readUint8(),
      depleted: reader.readBoolean(),
      ownerEntityId: reader.readUint32(),
      shieldStrength: Utils.switchNumber(reader.readUint8(), {
        1: 'small' as const,
        2: 'medium' as const,
        3: 'big' as const,
      }),
    };
  }
}

export type PlayerShieldModel = EntityModel & {
  depleted: boolean;
  entityType: 'playerShield';
  health: number;
  ownerEntityId: number;
  shieldStrength: ShieldStrength;
};
