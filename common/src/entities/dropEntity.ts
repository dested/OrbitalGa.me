import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel, EntityModelSchema} from './entity';
import {GameConstants} from '../game/gameConstants';
import {Utils} from '../utils/utils';
import {PlayerEntity} from './playerEntity';
import {Size} from './meteorEntity';
import {PlayerWeapon} from '../game/gameRules';
import {unreachable} from '../utils/unreachable';
import {ImpliedEntityType} from '../models/entityTypeModels';
import {ABSizeByType} from '../parsers/arrayBufferSchemaTypes';
import {PlayerWeaponEnumSchema} from '../models/enums';
import {EntityModelSchemaType} from '../models/serverToClientMessages';

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

export class DropEntity extends Entity {
  boundingBoxes = [{width: 50, height: 50}];
  drop: DropType;
  entityType = 'drop' as const;

  constructor(game: Game, messageModel: ImpliedEntityType<DropModel>) {
    super(game, messageModel);
    this.drop = messageModel.drop;
    this.createPolygon();
  }

  get realX() {
    return this.x;
  }

  get realY() {
    return this.y;
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (!this.game.isClient) {
      if (otherEntity instanceof PlayerEntity) {
        otherEntity.addDrop(this.drop);
        this.destroy();
      }
    }
    return false;
  }

  gameTick(duration: number) {
    this.y += 10;
    if (this.y > GameConstants.screenSize.height * 1.2) {
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
      entityType: 'drop',
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
          {item: {ammo: amount * 1000, weapon: 'laser2' as const}, weight: 20},
          {item: {ammo: amount, weapon: 'rocket' as const}, weight: 50},
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

export type DropModel = EntityModel & {
  drop: DropType;
  entityType: 'drop';
};

export const DropModelSchema: EntityModelSchemaType<'drop'> = {
  ...EntityModelSchema,
  drop: {
    flag: 'type-lookup',
    elements: {
      weapon: {
        type: 1,
        ammo: 'uint8',
        weapon: PlayerWeaponEnumSchema,
      },
      health: {
        type: 2,
        amount: 'uint8',
      },
      shield: {
        type: 3,
        level: {
          flag: 'enum',
          medium: 1,
          big: 2,
        },
      },
    },
  },
};
