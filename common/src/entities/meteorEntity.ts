import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameConstants} from '../game/gameConstants';
import {Utils} from '../utils/utils';
import {ExplosionEntity} from './explosionEntity';
import {nextId} from '../utils/uuid';
import {isPlayerWeapon} from './weapon';
import {PlayerWeapon} from './playerEntity';
import {DropEntity} from './dropEntity';

export type Size = 'big' | 'med' | 'small' | 'tiny';

export class MeteorEntity extends Entity {
  health: number;
  meteorColor: 'brown' | 'grey';
  momentumX = Math.random() * 10 - 5;
  momentumY = 5 + Math.random() * 10;
  positionBuffer: {rotate: number; time: number; x: number; y: number}[] = [];
  rotate = Math.random() * 255;
  rotateSpeed = Math.round(1 + Math.random() * 3);
  size: Size;
  type: 1 | 2 | 3 | 4;

  constructor(
    game: Game,
    entityId: number,
    meteorColor: MeteorEntity['meteorColor'],
    size: MeteorEntity['size'],
    type: MeteorEntity['type']
  ) {
    super(game, entityId, 'meteor');
    this.meteorColor = meteorColor;
    this.size = size;
    this.type = type;

    switch (size) {
      case 'big':
        switch (type) {
          case 1:
            this.boundingBoxes = [{width: 101, height: 84}];
            break;
          case 2:
            this.boundingBoxes = [{width: 120, height: 98}];
            break;
          case 3:
            this.boundingBoxes = [{width: 89, height: 82}];
            break;
          case 4:
            this.boundingBoxes = [{width: 98, height: 96}];
            break;
        }
        break;
      case 'med':
        switch (type) {
          case 1:
            this.boundingBoxes = [{width: 43, height: 43}];
            break;
          case 2:
            this.boundingBoxes = [{width: 45, height: 40}];
            break;
        }
        break;
      case 'small':
        switch (type) {
          case 1:
            this.boundingBoxes = [{width: 28, height: 28}];
            break;
          case 2:
            this.boundingBoxes = [{width: 29, height: 26}];
            break;
        }
        break;
      case 'tiny':
        switch (type) {
          case 1:
            this.boundingBoxes = [{width: 18, height: 18}];
            break;
          case 2:
            this.boundingBoxes = [{width: 16, height: 15}];
            break;
        }
        break;
    }
    switch (size) {
      case 'big':
        this.health = Math.ceil(5 + Math.random() * 5);
        break;
      case 'med':
        this.health = Math.ceil(4 + Math.random() * 4);
        break;
      case 'small':
        this.health = Math.ceil(3 + Math.random() * 3);
        break;
      case 'tiny':
        this.health = Math.ceil(2 + Math.random() * 2);
        break;
    }
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
      if (isPlayerWeapon(otherEntity)) {
        otherEntity.hurt(
          1,
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
    }
    return false;
  }

  gameTick(duration: number) {
    this.rotate += this.rotateSpeed;
    this.x += this.momentumX;
    this.y += this.momentumY;
    this.y += 3;
    if (this.y > GameConstants.screenSize.height * 1.2) {
      this.destroy();
    }
  }

  interpolateEntity(renderTimestamp: number) {
    const buffer = this.positionBuffer;

    while (buffer.length >= 2 && buffer[1].time <= renderTimestamp) {
      buffer.shift();
    }

    if (buffer.length >= 2 && buffer[0].time <= renderTimestamp) {
      const x0 = buffer[0].x;
      const x1 = buffer[1].x;

      const y0 = buffer[0].y;
      const y1 = buffer[1].y;

      const rotate0 = buffer[0].rotate;
      let rotate1 = buffer[1].rotate;

      if (rotate1 < rotate0) {
        rotate1 += 255;
      }
      const t0 = buffer[0].time;
      const t1 = buffer[1].time;

      this.x = x0 + ((x1 - x0) * (renderTimestamp - t0)) / (t1 - t0);
      this.y = y0 + ((y1 - y0) * (renderTimestamp - t0)) / (t1 - t0);
      this.rotate = rotate0 + ((rotate1 - rotate0) * (renderTimestamp - t0)) / (t1 - t0);
    }
  }

  reconcileFromServer(messageModel: MeteorModel) {
    super.reconcileFromServer(messageModel);
    this.positionBuffer[this.positionBuffer.length - 1].rotate = messageModel.rotate;
    this.meteorColor = messageModel.meteorColor;
    this.size = messageModel.size;
    this.type = messageModel.type;
  }

  serialize(): MeteorModel {
    return {
      ...super.serialize(),
      type: this.type,
      meteorColor: this.meteorColor,
      size: this.size,
      rotate: this.rotate,
      entityType: 'meteor',
    };
  }

  updatePolygon() {
    super.updatePolygon();
    if (this.boundingBoxes[0].polygon) this.boundingBoxes[0].polygon.angle = Utils.byteDegToRad(this.rotate);
  }

  private hurt(damage: number, otherEntity: Entity, x: number, y: number) {
    if (this.markToDestroy) return;
    this.health -= damage;
    const explosionEntity = new ExplosionEntity(this.game, nextId(), 1, this.entityId);
    explosionEntity.start(x, y);
    this.game.entities.push(explosionEntity);
    this.momentumX += x;
    this.momentumY += y;
    if (this.health <= 0) {
      const drop = new DropEntity(this.game, nextId(), DropEntity.randomDrop(this.size));
      drop.start(this.x, this.y);
      this.game.entities.push(drop);
      this.game.explode(this, 'small');
    }
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: MeteorModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint8(entity.rotate);
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

  static randomMeteor() {
    const meteorColor = Utils.randomElement(['brown' as const, 'grey' as const]);
    const size = Utils.randomElement(['big' as const, 'med' as const, 'small' as const, 'tiny' as const]);
    const type =
      size === 'big'
        ? Utils.randomElement([1 as const, 2 as const, 3 as const, 4 as const])
        : Utils.randomElement([1 as const, 2 as const]);

    return {meteorColor, size, type};
  }

  static readBuffer(reader: ArrayBufferReader): MeteorModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'meteor',
      rotate: reader.readUint8(),
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
}

export type MeteorModel = EntityModel & {
  entityType: 'meteor';
  meteorColor: 'brown' | 'grey';
  rotate: number;
  size: 'big' | 'med' | 'small' | 'tiny';
  type: 1 | 2 | 3 | 4;
};
