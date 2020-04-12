import {Polygon, Result} from 'collisions';
import {Utils} from '../utils/utils';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ExplosionEntity} from './explosionEntity';
import {nextId} from '../utils/uuid';
import {EnemyShotEntity} from './enemyShotEntity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameRules} from '../game/gameRules';
import {MomentumRunner} from '../utils/momentumRunner';
import {isPlayerWeapon, Weapon} from './weapon';
import {DropEntity} from './dropEntity';
import {BossEvent1PieceType} from './bossEvent1Entity';

export class BossEvent1EnemyEntity extends Entity implements Weapon {
  aliveTick: number = 0;
  damage = 2;
  explosionIntensity = 4;
  isWeapon = true as const;
  weaponSide = 'enemy' as const;

  constructor(
    game: Game,
    entityId: number,
    public ownerEntityId: number,
    public pieceType: BossEvent1PieceType,
    public xOffset: number,
    public yOffset: number,
    public rotate: number
  ) {
    super(game, entityId, 'bossEvent1Enemy');

    this.createPolygon();
  }

  get realX() {
    return this.x + this.xOffset;
  }

  get realY() {
    return this.y + this.yOffset;
  }

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

  start(x: number, y: number) {
    super.start(x, y);
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: BossEvent1EnemyModel) {
    Entity.addBuffer(buff, entity);
    buff.addSwitch(entity.pieceType, {
      nose: 1,
      body1: 2,
      body2: 3,
      body3: 4,
      bodyBack1: 5,
      bodyBack2: 6,
    });
    buff.addInt32(entity.ownerEntityId);
    buff.addInt32(entity.xOffset);
    buff.addInt32(entity.yOffset);
    buff.addInt32(entity.rotate);
  }

  static readBuffer(reader: ArrayBufferReader): BossEvent1EnemyModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'bossEvent1Enemy' as const,
      pieceType: reader.switch({
        1: () => 'nose' as const,
        2: () => 'body1' as const,
        3: () => 'body2' as const,
        4: () => 'body3' as const,
        5: () => 'bodyBack1' as const,
        6: () => 'bodyBack2' as const,
      }),
      ownerEntityId: reader.readInt32(),
      xOffset: reader.readInt32(),
      yOffset: reader.readInt32(),
      rotate: reader.readInt32(),
    };
  }
}

export type BossEvent1EnemyModel = EntityModel & {
  entityType: 'bossEvent1Enemy';
  pieceType: BossEvent1PieceType;
  ownerEntityId: number;
  rotate: number;
  xOffset: number;
  yOffset: number;
};
