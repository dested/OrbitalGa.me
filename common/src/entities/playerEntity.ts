import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {GameConstants} from '../game/gameConstants';
import {ShotEntity} from './shotEntity';
import {nextId} from '../utils/uuid';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {WallEntity} from './wallEntity';
import {EnemyShotEntity} from './enemyShotEntity';
import {ShotExplosionEntity} from './shotExplosionEntity';
import {PlayerShieldEntity} from './playerShieldEntity';
import {GameRules} from "../game/gameRules";

export type PendingInput = {
  inputSequenceNumber: number;
  left: boolean;
  shoot: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

export class PlayerEntity extends Entity {
  get realX() {
    return this.x;
  }
  get realY() {
    return this.y;
  }

  boundingBoxes = [{width: 99, height: 75}];
  xInputsThisTick: boolean = false;
  yInputsThisTick: boolean = false;

  constructor(game: Game, entityId: number) {
    super(game, entityId, 'player');
    this.createPolygon();
  }

  private shieldEntityId?: number;
  setShieldEntity(shieldEntityId: number) {
    this.shieldEntityId = shieldEntityId;
  }

  lastProcessedInputSequenceNumber: number = 0;

  pendingInputs: PendingInput[] = [];
  inputSequenceNumber: number = 1;

  momentum: {x: number; y: number} = {x: 0, y: 0};

  shootTimer: number = 1;
  dead: boolean = false;
  shotSide: 'left' | 'right' = 'left';

  applyInput(input: PendingInput) {
    this.xInputsThisTick = false;
    this.yInputsThisTick = false;

    if (input.shoot) {
      if (!this.game.isClient) {
        if (this.shootTimer <= 0) {
          const shotEntity = new ShotEntity(this.game, nextId(), this.entityId);
          shotEntity.start(this.shotSide === 'left' ? -42 : 42, -6);
          this.game.entities.push(shotEntity);
          this.shotSide = this.shotSide === 'left' ? 'right' : 'left';
          this.shootTimer = 1;
        }
      }
    }

    const ramp = 30;
    if (input.left) {
      this.xInputsThisTick = true;
      this.momentum.x -= ramp;
      if (this.momentum.x < -GameRules.player.base.maxSpeed) {
        this.momentum.x = -GameRules.player.base.maxSpeed;
      }
    }
    if (input.right) {
      this.xInputsThisTick = true;
      this.momentum.x += ramp;
      if (this.momentum.x > GameRules.player.base.maxSpeed) {
        this.momentum.x = GameRules.player.base.maxSpeed;
      }
    }
    if (input.up) {
      this.yInputsThisTick = true;
      this.momentum.y -= ramp;
      if (this.momentum.y < -GameRules.player.base.maxSpeed) {
        this.momentum.y = -GameRules.player.base.maxSpeed;
      }
    }
    if (input.down) {
      this.yInputsThisTick = true;
      this.momentum.y += ramp;
      if (this.momentum.y > GameRules.player.base.maxSpeed) {
        this.momentum.y = GameRules.player.base.maxSpeed;
      }
    }
  }

  destroy(): void {
    super.destroy();
  }

  health = GameRules.player.base.startingHealth;

  gameTick(): void {
    this.shootTimer = Math.max(this.shootTimer - 1, 0);
    this.updatedPositionFromMomentum();

    if (!this.game.isClient) {
      if (this.health <= 0) {
        this.dead = true;

        for (let i = 0; i < 15; i++) {
          const shotExplosionEntity = new ShotExplosionEntity(this.game, nextId());
          shotExplosionEntity.start(
            this.x - this.boundingBoxes[0].width / 2 + Math.random() * this.boundingBoxes[0].width,
            this.y - this.boundingBoxes[0].height / 2 + Math.random() * this.boundingBoxes[0].height
          );
          this.game.entities.push(shotExplosionEntity);
        }

        if (this.shieldEntityId) this.game.entities.lookup(this.shieldEntityId).destroy();
        this.destroy();
      }
    }
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof WallEntity) {
      this.x -= collisionResult.overlap * collisionResult.overlap_x;
      this.y -= collisionResult.overlap * collisionResult.overlap_y;
      this.updatePolygon();
      return true;
    }
    if (!this.game.isClient) {
      if (otherEntity instanceof EnemyShotEntity) {
        const shield = this.game.entities.lookup<PlayerShieldEntity>(this.shieldEntityId!);
        if (!shield.depleted) {
          return false;
        }

        this.health -= 1;
        this.game.destroyEntity(otherEntity);
        const shotExplosionEntity = new ShotExplosionEntity(this.game, nextId(), this.entityId);
        shotExplosionEntity.start(
          this.realX - collisionResult.overlap * collisionResult.overlap_x,
          this.realY - collisionResult.overlap * collisionResult.overlap_y
        );
        this.game.entities.push(shotExplosionEntity);

        return true;
      }
    }
    return false;
  }

  updatedPositionFromMomentum() {
    this.x += this.momentum.x;
    this.y += this.momentum.y;

    if (!this.xInputsThisTick) {
      this.momentum.x = this.momentum.x * GameRules.player.base.momentumDeceleration;
    }
    if (!this.yInputsThisTick) {
      this.momentum.y = this.momentum.y * GameRules.player.base.momentumDeceleration;
    }
    if (Math.abs(this.momentum.x) < 3) {
      this.momentum.x = 0;
    }
    if (Math.abs(this.momentum.y) < 3) {
      this.momentum.y = 0;
    }

    const {x0, x1} = this.game.getPlayerRange(1000, (entity) => this !== entity);
    if (this.x < x0) {
      this.x = x0;
      this.momentum.x = 0;
    }
    if (this.x > x1) {
      this.x = x1;
      this.momentum.x = 0;
    }

    if (this.y < GameConstants.screenSize.height * 0.1) {
      this.y = GameConstants.screenSize.height * 0.1;
      this.momentum.y = 0;
    }
    if (this.y > GameConstants.screenSize.height * 1.1) {
      this.y = GameConstants.screenSize.height * 1.1;
      this.momentum.y = 0;
    }
  }

  reconcileFromServer(messageEntity: PlayerModel) {
    super.reconcileFromServer(messageEntity);
    this.reconcileDataFromServer(messageEntity);
  }

  reconcileDataFromServer(messageEntity: PlayerModel) {
    // needed because LivePlayerEntity does not need the pending inputs from super.reconcile
    this.health = messageEntity.health;
    this.dead = messageEntity.dead;
    this.lastProcessedInputSequenceNumber = messageEntity.lastProcessedInputSequenceNumber;
    this.momentum.x = messageEntity.momentumX;
    this.momentum.y = messageEntity.momentumY;
  }

  serialize(): PlayerModel {
    return {
      ...super.serialize(),
      momentumX: this.momentum.x,
      momentumY: this.momentum.y,
      lastProcessedInputSequenceNumber: this.lastProcessedInputSequenceNumber,
      health: this.health,
      dead: this.dead,
      entityType: 'player',
    };
  }

  static readBuffer(reader: ArrayBufferReader): PlayerModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'player',
      momentumX: reader.readFloat32(),
      momentumY: reader.readFloat32(),
      health: reader.readUint8(),
      dead: reader.readBoolean(),
      lastProcessedInputSequenceNumber: reader.readUint32(),
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: PlayerModel) {
    Entity.addBuffer(buff, entity);
    buff.addFloat32(entity.momentumX);
    buff.addFloat32(entity.momentumY);
    buff.addUint8(entity.health);
    buff.addBoolean(entity.dead);
    buff.addUint32(entity.lastProcessedInputSequenceNumber);
  }
}

export type PlayerModel = EntityModel & {
  entityType: 'player';
  lastProcessedInputSequenceNumber: number;
  momentumX: number;
  momentumY: number;
  health: number;
  dead: boolean;
};
