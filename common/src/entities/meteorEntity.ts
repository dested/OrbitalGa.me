import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameConstants} from '../game/gameConstants';
import {Utils} from '../utils/utils';
import {WallEntity} from './wallEntity';
import {EnemyShotEntity} from './enemyShotEntity';
import {PlayerShieldEntity} from './playerShieldEntity';
import {ShotExplosionEntity} from './shotExplosionEntity';
import {nextId} from '../utils/uuid';
import {ShotEntity} from './shotEntity';
import {PlayerEntity} from './playerEntity';

export class MeteorEntity extends Entity {
  health = Math.ceil(3 + Math.random() * 3);

  meteorColor: 'brown' | 'grey';

  positionBuffer: {rotate: number; time: number; x: number; y: number}[] = [];

  rotate = Math.random() * 255;
  rotateSpeed = Math.round(1 + Math.random() * 3);
  size: 'big' | 'med' | 'small' | 'tiny';

  speed = 5 + Math.random() * 10;
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
      if (otherEntity instanceof ShotEntity) {
        this.health -= 1;
        this.game.destroyEntity(otherEntity);
        const shotExplosionEntity = new ShotExplosionEntity(this.game, nextId(), 1, this.entityId);
        shotExplosionEntity.start(
          collisionResult.overlap * collisionResult.overlap_x,
          collisionResult.overlap * collisionResult.overlap_y
        );
        this.game.entities.push(shotExplosionEntity);

        if (this.health <= 0) {
          this.die();
        }

        return true;
      }
      if (otherEntity instanceof PlayerEntity) {
        if (
          otherEntity.hurt(
            1,
            this,
            collisionResult.overlap * collisionResult.overlap_x,
            collisionResult.overlap * collisionResult.overlap_y
          )
        ) {
          otherEntity.momentum.x = collisionResult.overlap * collisionResult.overlap_x * 4;
          otherEntity.momentum.y = collisionResult.overlap * collisionResult.overlap_y * 4;
          this.x += collisionResult.overlap * collisionResult.overlap_x * 3;
          this.y += collisionResult.overlap * collisionResult.overlap_y * 3;

          this.health -= 1;
          if (this.health <= 0) {
            this.die();
          }
          return true;
        }
      }
      if (otherEntity instanceof PlayerShieldEntity) {
        if (
          otherEntity.hurt(
            1,
            this,
            collisionResult.overlap * collisionResult.overlap_x,
            collisionResult.overlap * collisionResult.overlap_y
          )
        ) {
          if (otherEntity.player) {
            otherEntity.player.momentum.x = collisionResult.overlap * collisionResult.overlap_x * 4;
            otherEntity.player.momentum.y = collisionResult.overlap * collisionResult.overlap_y * 4;
          }
          this.x -= collisionResult.overlap * collisionResult.overlap_x * 3;
          this.y -= collisionResult.overlap * collisionResult.overlap_y * 3;
          this.health -= 1;
          if (this.health <= 0) {
            this.die();
          }
          return true;
        }
      }
    }
    return false;
  }

  gameTick(duration: number) {
    this.rotate += this.rotateSpeed;
    this.y += this.speed;
    if (this.y > GameConstants.screenSize.height * 1.2) {
      this.game.destroyEntity(this);
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
  reconcileFromServer(messageEntity: MeteorModel) {
    super.reconcileFromServer(messageEntity);
    this.positionBuffer[this.positionBuffer.length - 1].rotate = messageEntity.rotate;
    this.meteorColor = messageEntity.meteorColor;
    this.size = messageEntity.size;
    this.type = messageEntity.type;
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

  private die() {
    this.game.destroyEntity(this);

    for (let i = 0; i < 5; i++) {
      const deathExplosion = new ShotExplosionEntity(this.game, nextId(), 2);
      deathExplosion.start(
        this.x - this.boundingBoxes[0].width / 2 + Math.random() * this.boundingBoxes[0].width,
        this.y - this.boundingBoxes[0].height / 2 + Math.random() * this.boundingBoxes[0].height
      );
      this.game.entities.push(deathExplosion);
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
