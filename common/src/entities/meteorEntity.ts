import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameConstants} from '../game/gameConstants';
import {Utils} from '../utils/utils';
import {ExplosionEntity} from './explosionEntity';
import {nextId} from '../utils/uuid';
import {isPlayerWeapon} from './weapon';
import {DropEntity} from './dropEntity';
import {ImpliedEntityType} from '../models/entityTypeModels';

export type Size = 'big' | 'med' | 'small' | 'tiny';

export class MeteorEntity extends Entity {
  entityType = 'meteor' as const;
  health: number;
  hit = false;
  meteorColor: 'brown' | 'grey';
  meteorType: '1' | '2' | '3' | '4';
  momentumX = Math.random() * 10 - 5;
  momentumY: number;
  positionBuffer: {rotate: number; time: number; x: number; y: number}[] = [];
  rotate: number;
  rotateSpeed = Math.round(1 + Math.random() * 3);
  size: Size;
  startingMomentumY: number;

  constructor(game: Game, messageModel: ImpliedEntityType<MeteorModel>) {
    super(game, messageModel);

    this.meteorColor = messageModel.meteorColor;
    this.size = messageModel.size;
    this.meteorType = messageModel.meteorType;
    this.rotate = messageModel.rotate;
    this.startingMomentumY = 5 + Math.random() * 10;
    this.momentumY = this.startingMomentumY;

    switch (messageModel.size) {
      case 'big':
        switch (messageModel.meteorType) {
          case '1':
            this.boundingBoxes = [{width: 101, height: 84}];
            break;
          case '2':
            this.boundingBoxes = [{width: 120, height: 98}];
            break;
          case '3':
            this.boundingBoxes = [{width: 89, height: 82}];
            break;
          case '4':
            this.boundingBoxes = [{width: 98, height: 96}];
            break;
        }
        break;
      case 'med':
        switch (messageModel.meteorType) {
          case '1':
            this.boundingBoxes = [{width: 43, height: 43}];
            break;
          case '2':
            this.boundingBoxes = [{width: 45, height: 40}];
            break;
        }
        break;
      case 'small':
        switch (messageModel.meteorType) {
          case '1':
            this.boundingBoxes = [{width: 28, height: 28}];
            break;
          case '2':
            this.boundingBoxes = [{width: 29, height: 26}];
            break;
        }
        break;
      case 'tiny':
        switch (messageModel.meteorType) {
          case '1':
            this.boundingBoxes = [{width: 18, height: 18}];
            break;
          case '2':
            this.boundingBoxes = [{width: 16, height: 15}];
            break;
        }
        break;
    }
    switch (messageModel.size) {
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
    if (isPlayerWeapon(otherEntity)) {
      otherEntity.hurt(
        1,
        this,
        collisionResult.overlap * collisionResult.overlap_x * 2,
        collisionResult.overlap * collisionResult.overlap_y * 2
      );
      this.hurt(
        otherEntity.damage,
        otherEntity,
        -collisionResult.overlap * collisionResult.overlap_x,
        -collisionResult.overlap * collisionResult.overlap_y
      );
      return true;
    }
    return false;
  }

  gameTick(duration: number) {
    this.rotate += this.rotateSpeed;
    this.x += this.momentumX;
    this.y += this.momentumY;

    if (this.momentumY < this.startingMomentumY) {
      this.momentumY += 0.1;
    }
    if (this.y > GameConstants.screenSize.height * 1.3) {
      this.destroy();
    }
    if (this.y < -GameConstants.screenSize.height * 1.3) {
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

  postTick() {
    super.postTick();
    this.hit = false;
  }

  reconcileFromServer(messageModel: MeteorModel) {
    if (messageModel.create) {
      this.x = messageModel.x;
      this.y = messageModel.y;
      this.positionBuffer.push({
        time: +new Date() - GameConstants.serverTickRate,
        x: messageModel.x,
        y: messageModel.y,
        rotate: messageModel.rotate,
      });
    }
    this.positionBuffer.push({
      time: +new Date(),
      x: messageModel.x,
      y: messageModel.y,
      rotate: messageModel.rotate,
    });
    this.meteorColor = messageModel.meteorColor;
    this.size = messageModel.size;
    this.meteorType = messageModel.meteorType;
    this.hit = messageModel.hit;
  }

  serialize(): MeteorModel {
    return {
      ...super.serialize(),
      meteorType: this.meteorType,
      meteorColor: this.meteorColor,
      size: this.size,
      rotate: this.rotate,
      entityType: 'meteor',
      hit: this.hit,
    };
  }

  updatePolygon() {
    super.updatePolygon();
    if (this.boundingBoxes[0].polygon) this.boundingBoxes[0].polygon.angle = Utils.byteDegToRad(this.rotate);
  }

  private hurt(damage: number, otherEntity: Entity, x: number, y: number) {
    if (this.markToDestroy) return;
    this.health -= damage;
    this.hit = true;
    const explosionEntity = new ExplosionEntity(this.game, {
      entityId: nextId(),
      x,
      y,
      intensity: 1,
      ownerEntityId: this.entityId,
    });
    this.game.entities.push(explosionEntity);
    this.momentumX += x;
    this.momentumY += y;
    if (!this.game.isClient) {
      if (this.health <= 0) {
        const drop = new DropEntity(this.game, {
          entityId: nextId(),
          x: this.x,
          y: this.y,
          drop: DropEntity.randomDrop(this.size),
        });
        this.game.entities.push(drop);
        this.game.explode(this, 'small');
      }
    }
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: MeteorModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint8(entity.rotate);
    buff.addSwitch(entity.meteorColor, {
      brown: 1,
      grey: 2,
    });
    buff.addSwitch(entity.size, {
      big: 1,
      med: 2,
      small: 3,
      tiny: 4,
    });
    buff.addSwitch(entity.meteorType, {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
    });
    buff.addBoolean(entity.hit);
  }

  static randomMeteor() {
    const meteorColor = Utils.randomElement(['brown' as const, 'grey' as const]);
    const size = Utils.randomElement(['big' as const, 'med' as const, 'small' as const, 'tiny' as const]);
    const type =
      size === 'big'
        ? Utils.randomElement(['1' as const, '2' as const, '3' as const, '4' as const])
        : Utils.randomElement(['1' as const, '2' as const]);

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
      meteorType: Utils.switchNumber(reader.readUint8(), {
        1: '1' as const,
        2: '2' as const,
        3: '3' as const,
        4: '4' as const,
      }),
      hit: reader.readBoolean(),
    };
  }
}

export type MeteorModel = EntityModel & {
  entityType: 'meteor';
  hit: boolean;
  meteorColor: 'brown' | 'grey';
  meteorType: '1' | '2' | '3' | '4';
  rotate: number;
  size: 'big' | 'med' | 'small' | 'tiny';
};
