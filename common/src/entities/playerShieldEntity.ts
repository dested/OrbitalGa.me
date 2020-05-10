import {Result} from 'collisions';
import {Game, OrbitalGame} from '../game/game';
import {Entity, EntityModel, EntityModelSchema} from '../baseEntities/entity';
import {GameRules} from '../game/gameRules';
import {PlayerEntity} from './playerEntity';
import {ImpliedEntityType} from '../models/serverToClientMessages';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {PhysicsEntity, PhysicsEntityModel, PhysicsEntityModelSchema} from '../baseEntities/physicsEntity';

export type ShieldStrength = 'small' | 'medium' | 'big';

export class PlayerShieldEntity extends PhysicsEntity {
  boundingBoxes = [];
  depleted: boolean;
  health: number;
  lastHit = 0;
  ownerEntityId: number;
  shieldStrength: ShieldStrength;
  tickIndex = 0;
  type = 'playerShield' as const;

  constructor(public game: OrbitalGame, messageModel: ImpliedEntityType<PlayerShieldModel>) {
    super(game, messageModel);
    this.ownerEntityId = messageModel.ownerEntityId;
    this.shieldStrength = messageModel.shieldStrength;
    this.health = messageModel.health;
    this.depleted = messageModel.depleted;
    this.createPolygon();
  }

  get player() {
    return this.game.entities.lookup<PlayerEntity>(this.ownerEntityId);
  }

  get realX() {
    const owner = this.game.entities.lookup(this.ownerEntityId);
    if (!owner) {
      return this.position.x;
    }
    return this.position.x + owner.realX;
  }

  get realY() {
    const owner = this.game.entities.lookup(this.ownerEntityId);
    if (!owner) {
      return this.position.y;
    }
    return this.position.y + owner.realY;
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
      type: 'playerShield',
    };
  }
}

export type PlayerShieldModel = PhysicsEntityModel & {
  depleted: boolean;
  health: number;
  ownerEntityId: number;
  shieldStrength: ShieldStrength;
  type: 'playerShield';
};

export const PlayerShieldModelSchema: SDTypeElement<PlayerShieldModel> = {
  ...PhysicsEntityModelSchema,
  health: 'uint8',
  depleted: 'boolean',
  ownerEntityId: 'uint32',
  shieldStrength: {
    flag: 'enum',
    small: 1,
    medium: 2,
    big: 3,
  },
};
