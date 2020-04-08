import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameConstants} from '../game/gameConstants';
import {Utils} from '../utils/utils';

export class MeteorEntity extends Entity {
  get realX() {
    return this.x;
  }
  get realY() {
    return this.y;
  }

  constructor(
    game: Game,
    entityId: number,
    public meteorColor: 'brown' | 'grey',
    public size: 'big' | 'med' | 'small' | 'tiny',
    public type: 1 | 2 | 3 | 4
  ) {
    super(game, entityId, 'meteor');
    this.createPolygon();
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    return false;
  }

  gameTick(duration: number) {
    this.y += 10;
    if (this.y > GameConstants.screenSize.height * 1.2) {
      this.game.destroyEntity(this);
    }
  }
  serialize(): MeteorModel {
    return {
      ...super.serialize(),
      type: this.type,
      meteorColor: this.meteorColor,
      size: this.size,
      entityType: 'meteor',
    };
  }
  reconcileFromServer(messageEntity: MeteorModel) {
    super.reconcileFromServer(messageEntity);
    this.meteorColor = messageEntity.meteorColor;
    this.size = messageEntity.size;
    this.type = messageEntity.type;
  }

  static readBuffer(reader: ArrayBufferReader): MeteorModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'meteor',
      meteorColor: Utils.switchNumber(reader.readUint8(), {
        1: 'brown' as const,
        2: 'grey' as const,
      }),
      size: Utils.switchNumber(reader.readUint8(), {
        1: 'big' as const,
        2: 'med' as const,
        3: 'small' as const,
        4: 'tiny' as const,
      }),
      type: Utils.switchNumber(reader.readUint8(), {
        1: 1 as const,
        2: 2 as const,
        3: 3 as const,
        4: 4 as const,
      }),
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: MeteorModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint8(
      Utils.switchType(entity.meteorColor, {
        brown: 1,
        grey: 2,
      })
    );
    buff.addUint8(
      Utils.switchType(entity.size, {
        big: 1,
        med: 2,
        small: 3,
        tiny: 4,
      })
    );
    buff.addUint8(
      Utils.switchType(entity.type, {
        1: 1,
        2: 2,
        3: 3,
        4: 4,
      })
    );
  }
}

export type MeteorModel = EntityModel & {
  entityType: 'meteor';
  meteorColor: 'brown' | 'grey';
  size: 'big' | 'med' | 'small' | 'tiny';
  type: 1 | 2 | 3 | 4;
};
