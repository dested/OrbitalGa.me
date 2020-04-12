import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameConstants} from '../game/gameConstants';
import {Utils} from '../utils/utils';
import {ExplosionEntity} from './explosionEntity';
import {nextId} from '../utils/uuid';
import {isPlayerWeapon} from './weapon';
import {PlayerEntity, PlayerWeapon} from './playerEntity';
import {Size} from './meteorEntity';

export type DropType =
  | {
      amount: number;
      type: 'health';
    }
  | {ammo: number; type: 'weapon'; weapon: PlayerWeapon};

export class DropEntity extends Entity {
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
        add to the player
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
    buff.addUint8(
      Utils.switchType(entity.drop.type, {
        health: 1,
        weapon: 2,
      })
    );
    switch (entity.drop.type) {
      case 'health':
        buff.addUint8(entity.drop.amount);
        break;
      case 'weapon':
        PlayerEntity.addBufferWeapon(buff, entity.drop.weapon);
        buff.addUint8(entity.drop.ammo);
        break;
    }
  }

  static randomDrop(size: Size): DropType {
    const type = Utils.randomWeightedElement<DropType['type']>([
      {item: 'weapon', weight: 30},
      {item: 'health', weight: 70},
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
        const weapon = Utils.randomWeightedElement<PlayerWeapon>([
          {item: 'rocket' as const, weight: 60},
          {item: 'torpedo' as const, weight: 40},
        ]);
        return {type: 'weapon', ammo: amount, weapon};
      case 'health':
        return {type: 'health', amount};
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
      })(),
    };
  }
}

export type DropModel = EntityModel & {
  drop: DropType;
  entityType: 'drop';
};
