import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameConstants} from '../game/gameConstants';
import {Utils} from '../utils/utils';
import {ExplosionEntity} from './explosionEntity';
import {nextId} from '../utils/uuid';
import {isPlayerWeapon} from './weapon';
import {PlayerEntity} from './playerEntity';
import {Size} from './meteorEntity';
import {PlayerWeapon} from '../game/gameRules';
import {unreachable} from '../utils/unreachable';

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

  constructor(game: Game, entityId: number, public drop: DropType) {
    super(game, entityId, 'drop');
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

  static addBuffer(buff: ArrayBufferBuilder, entity: DropModel) {
    Entity.addBuffer(buff, entity);
    buff.addSwitch(entity.drop.type, {
      health: 1,
      weapon: 2,
      shield: 3,
    });
    switch (entity.drop.type) {
      case 'health':
        buff.addUint8(entity.drop.amount);
        break;
      case 'shield':
        buff.addSwitch(entity.drop.level, {
          medium: 2,
          big: 3,
        });
        break;
      case 'weapon':
        PlayerEntity.addBufferWeapon(buff, entity.drop.weapon);
        buff.addUint8(entity.drop.ammo);
        break;
      default:
        unreachable(entity.drop);
    }
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

  static readBuffer(reader: ArrayBufferReader): DropModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'drop',
      drop: Utils.switchNumber(reader.readUint8(), {
        1: () =>
          ({
            type: 'health',
            amount: reader.readUint8(),
          } as DropType),
        2: () =>
          ({
            type: 'weapon',
            weapon: PlayerEntity.readBufferWeapon(reader),
            ammo: reader.readUint8(),
          } as DropType),
        3: () =>
          ({
            type: 'shield',
            level: Utils.switchNumber(reader.readUint8(), {
              2: 'medium',
              3: 'big',
            }),
          } as DropType),
      })(),
    };
  }
}

export type DropModel = EntityModel & {
  drop: DropType;
  entityType: 'drop';
};
