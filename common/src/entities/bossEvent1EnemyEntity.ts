import {Result} from 'collisions';
import {OrbitalGame} from '../game/game';
import {Entity} from '../baseEntities/entity';
import {WeaponEntity} from './weaponEntity';
import {BossEvent1PieceType} from './bossEvent1Entity';
import {ImpliedEntityType} from '../models/serverToClientMessages';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {
  ImpliedDefaultPhysics,
  PhysicsEntity,
  PhysicsEntityModel,
  PhysicsEntityModelSchema,
} from '../baseEntities/physicsEntity';

export class BossEvent1EnemyEntity extends PhysicsEntity implements WeaponEntity {
  aliveTick: number = 0;
  damage = 2;
  explosionIntensity = 4;
  isWeapon = true as const;
  ownerEntityId: number;
  ownerPlayerEntityId: number;
  pieceType: BossEvent1PieceType;
  rotate: number;
  type = 'bossEvent1Enemy' as const;
  weaponSide = 'enemy' as const;
  xOffset: number;
  yOffset: number;

  constructor(public game: OrbitalGame, messageModel: ImpliedEntityType<ImpliedDefaultPhysics<BossEvent1EnemyModel>>) {
    super(game, messageModel);
    this.ownerPlayerEntityId = messageModel.ownerEntityId;
    this.xOffset = messageModel.xOffset;
    this.yOffset = messageModel.yOffset;
    this.rotate = messageModel.rotate;
    this.pieceType = messageModel.pieceType;
    this.ownerEntityId = messageModel.ownerEntityId;
    this.createPolygon();
  }

  causedDamage(damage: number, otherEntity: Entity): void {}
  causedKill(otherEntity: Entity): void {}

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    return false;
  }
  createPolygon() {
    super.createPolygon(this.position.x + this.xOffset, this.position.y + this.yOffset);
  }

  gameTick(duration: number): void {
    this.aliveTick++;
  }

  hurt(damage: number, otherEntity: Entity, x: number, y: number) {}

  inView(viewX: number, viewY: number, viewWidth: number, viewHeight: number, playerId: number): boolean {
    return (
      this.position.x + this.xOffset > viewX &&
      this.position.x + this.xOffset < viewX + viewWidth &&
      this.position.y + this.yOffset > viewY &&
      this.position.y + this.yOffset < viewY + viewHeight
    );
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
      type: 'bossEvent1Enemy',
      xOffset: this.xOffset,
      ownerEntityId: this.ownerEntityId,
      pieceType: this.pieceType,
      yOffset: this.yOffset,
      rotate: this.rotate,
    };
  }
}

export type BossEvent1EnemyModel = PhysicsEntityModel & {
  ownerEntityId: number;
  pieceType: BossEvent1PieceType;
  rotate: number;
  type: 'bossEvent1Enemy';
  xOffset: number;
  yOffset: number;
};

export const BossEvent1EnemyModelSchema: SDTypeElement<BossEvent1EnemyModel> = {
  ...PhysicsEntityModelSchema,
  xOffset: 'int32',
  yOffset: 'int32',
  ownerEntityId: 'uint32',
  rotate: 'int32',
  pieceType: {
    flag: 'enum',
    bodyBack1: 1,
    body1: 2,
    body2: 3,
    body3: 4,
    bodyBack2: 5,
    nose: 6,
  },
};
