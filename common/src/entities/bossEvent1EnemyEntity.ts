import {Polygon, Result} from 'collisions';
import {Utils} from '../utils/utils';
import {Game} from '../game/game';
import {Entity, EntityModel, EntityModelSchema} from './entity';
import {ExplosionEntity} from './explosionEntity';
import {nextId} from '../utils/uuid';
import {EnemyShotEntity} from './enemyShotEntity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameRules} from '../game/gameRules';
import {MomentumRunner} from '../utils/momentumRunner';
import {isPlayerWeapon, Weapon} from './weapon';
import {DropEntity} from './dropEntity';
import {BossEvent1PieceType} from './bossEvent1Entity';
import {ImpliedEntityType} from '../models/entityTypeModels';
import {EntitySizeByType} from '../parsers/arrayBufferSchema';
import {WallModel} from './wallEntity';

export class BossEvent1EnemyEntity extends Entity implements Weapon {
  aliveTick: number = 0;
  damage = 2;
  entityType = 'bossEvent1Enemy' as const;
  explosionIntensity = 4;
  isWeapon = true as const;
  ownerEntityId: number;
  pieceType: BossEvent1PieceType;
  rotate: number;
  weaponSide = 'enemy' as const;
  xOffset: number;
  yOffset: number;

  constructor(game: Game, messageModel: ImpliedEntityType<BossEvent1EnemyModel>) {
    super(game, messageModel);
    this.xOffset = messageModel.xOffset;
    this.yOffset = messageModel.yOffset;
    this.rotate = messageModel.rotate;
    this.pieceType = messageModel.pieceType;
    this.ownerEntityId = messageModel.ownerEntityId;
    this.createPolygon();
  }

  get realX() {
    return this.x + this.xOffset;
  }

  get realY() {
    return this.y + this.yOffset;
  }
  causedDamage(damage: number, otherEntity: Entity): void {}
  causedKill(otherEntity: Entity): void {}

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    /* if (isPlayerWeapon(otherEntity)) {
      otherEntity.hurt(
        otherEntity.damage,
        this,
        collisionResult.overlap * collisionResult.overlap_x,
        collisionResult.overlap * collisionResult.overlap_y
      );
      this.hurt(
        otherEntity.damage,
        otherEntity,
        -collisionResult.overlap * collisionResult.overlap_x,
        -collisionResult.overlap * collisionResult.overlap_y
      );

      return true;
    }
*/
    return false;
  }

  gameTick(duration: number): void {
    this.aliveTick++;
  }

  hurt(damage: number, otherEntity: Entity, x: number, y: number) {
    /*
    if (this.markToDestroy) {
      return;
    }
    this.health -= damage;
    this.momentumX += x;
    this.momentumY += y;

    const explosionEntity = new ExplosionEntity(this.game, nextId(), this.explosionIntensity, this.entityId);
    explosionEntity.start(otherEntity.x - this.x, otherEntity.y - this.y);
    this.game.entities.push(explosionEntity);
    if (this.health <= 0) {
      const drop = new DropEntity(this.game, nextId(), DropEntity.randomDrop('big'));
      drop.start(this.x, this.y);
      this.game.entities.push(drop);
      this.game.explode(this, 'medium');
    }
*/
  }

  reconcileFromServer(messageModel: BossEvent1EnemyModel) {
    super.reconcileFromServer(messageModel);
    this.xOffset = messageModel.xOffset;
    this.yOffset = messageModel.yOffset;
    this.rotate = messageModel.rotate;
    this.pieceType = messageModel.pieceType;
    this.ownerEntityId = messageModel.ownerEntityId;
  }

  serialize(): BossEvent1EnemyModel {
    return {
      ...super.serialize(),
      entityType: 'bossEvent1Enemy',
      xOffset: this.xOffset,
      ownerEntityId: this.ownerEntityId,
      pieceType: this.pieceType,
      yOffset: this.yOffset,
      rotate: this.rotate,
    };
  }
}

export type BossEvent1EnemyModel = EntityModel & {
  entityType: 'bossEvent1Enemy';
  ownerEntityId: number;
  pieceType: BossEvent1PieceType;
  rotate: number;
  xOffset: number;
  yOffset: number;
};

export const BossEvent1EnemyModelSchema: EntitySizeByType<BossEvent1EnemyModel, 'bossEvent1Enemy'> = {
    entityType: 13,
  ...EntityModelSchema,
  xOffset: 'int32',
  yOffset: 'int32',
  ownerEntityId: 'uint32',
  rotate: 'int32',
  pieceType: {
    enum: true,
    bodyBack1: 1,
    body1: 2,
    body2: 3,
    body3: 4,
    bodyBack2: 5,
    nose: 6,
  },
};
