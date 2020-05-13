import {Result} from 'collisions';
import {Game, OrbitalGame} from '../game/game';
import {Entity, EntityModel, EntityModelSchema} from '../baseEntities/entity';
import {GameConstants} from '../game/gameConstants';
import {Utils} from '../utils/utils';
import {PlayerEntity} from './playerEntity';
import {Size} from './meteorEntity';
import {PlayerWeapon} from '../game/gameRules';
import {unreachable} from '../utils/unreachable';
import {ImpliedEntityType} from '../models/serverToClientMessages';
import {PlayerWeaponEnumSchema} from '../models/schemaEnums';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {
  ImpliedDefaultPhysics,
  PhysicsEntity,
  PhysicsEntityModel,
  PhysicsEntityModelSchema,
} from '../baseEntities/physicsEntity';

export type DropType =
  | {
      amount: number;
      type: 'health';
    }
  | {
      level: 'medium' | 'big';
      type: 'shield';
    }
  | {ammo: number; type: 'weapon'; weapon: PlayerWeapon};

export class DropEntity extends PhysicsEntity {
  boundingBoxes = [{width: 50, height: 50}];
  drop: DropType;
  type = 'drop' as const;

  constructor(public game: OrbitalGame, messageModel: ImpliedEntityType<ImpliedDefaultPhysics<DropModel>>) {
    super(game, messageModel);
    this.drop = messageModel.drop;
    this.createPolygon();
    this.velocity.set(0, 50);
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof PlayerEntity) {
      if (!this.game.isClient) {
        otherEntity.addDrop(this.drop);
      }
      this.destroy();
    }
    return false;
  }

  gameTick(duration: number) {
    if (this.position.y > GameConstants.screenSize.height * 1.2) {
      this.destroy();
    }
  }

  reconcileFromServer(messageModel: DropModel) {
    super.reconcileFromServer(messageModel);
    this.drop = messageModel.drop;
  }

  serialize(): DropModel {
    return {
      ...super.serialize(),
      drop: this.drop,
      type: 'drop',
    };
  }

  static randomDrop(size: Size): DropType {
    const type = Utils.randomWeightedElement<DropType['type']>([
      {item: 'weapon', weight: 40},
      {item: 'shield', weight: 10},
      {item: 'health', weight: 50},
    ]);
    let amount;
    switch (size) {
      case 'big':
        amount = Math.ceil(5 + Math.random() * 5);
        break;
      case 'med':
        amount = Math.ceil(4 + Math.random() * 4);
        break;
      case 'small':
        amount = Math.ceil(3 + Math.random() * 3);
        break;
      case 'tiny':
        amount = Math.ceil(1 + Math.random() * 2);
        break;
    }
    switch (type) {
      case 'weapon':
        const weapon = Utils.randomWeightedElement<{ammo: number; weapon: PlayerWeapon}>([
          {item: {ammo: amount * 1000, weapon: 'laser1Spray10' as const}, weight: 10},
          {item: {ammo: amount * 1000, weapon: 'laser2' as const}, weight: 20},
          {item: {ammo: amount, weapon: 'rocket' as const}, weight: 40},
          {item: {ammo: amount, weapon: 'torpedo' as const}, weight: 30},
        ]);
        return {type: 'weapon', weapon: weapon.weapon, ammo: weapon.ammo};
      case 'health':
        return {type: 'health', amount};
      case 'shield':
        return {type: 'shield', level: amount > 7 ? ('big' as const) : ('medium' as const)};
      default:
        throw unreachable(type);
    }
  }
}

export type DropModel = PhysicsEntityModel & {
  drop: DropType;
  type: 'drop';
};

export const DropModelSchema: SDTypeElement<DropModel> = {
  ...PhysicsEntityModelSchema,
  drop: {
    flag: 'type-lookup',
    elements: {
      weapon: {
        ammo: 'uint8',
        weapon: PlayerWeaponEnumSchema,
      },
      health: {
        amount: 'uint8',
      },
      shield: {
        level: {
          flag: 'enum',
          medium: 1,
          big: 2,
        },
      },
    },
  },
};
