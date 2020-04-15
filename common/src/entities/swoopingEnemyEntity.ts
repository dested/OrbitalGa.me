import {Result} from 'collisions';
import {assertType, Utils} from '../utils/utils';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ExplosionEntity} from './explosionEntity';
import {nextId} from '../utils/uuid';
import {EnemyShotEntity} from './enemyShotEntity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameRules, PlayerWeapon} from '../game/gameRules';
import {MomentumRunner} from '../utils/momentumRunner';
import {isPlayerWeapon, Weapon} from './weapon';
import {DropEntity} from './dropEntity';
import {ImpliedEntityType} from '../models/entityTypeModels';

export type EnemyColor = 'black' | 'blue' | 'green' | 'red';

export class SwoopingEnemyEntity extends Entity implements Weapon {
  aliveTick: number = 0;
  // width = 112;
  // height = 75;
  boundingBoxes = [
    {width: 112, height: 34, offsetY: 41},
    {width: 57, height: 41, offsetX: 35},
  ];
  damage = 2;
  enemyColor: EnemyColor;
  entityType = 'swoopingEnemy' as const;
  explosionIntensity = 4;
  health: number = GameRules.enemies.swoopingEnemy.startingHealth;
  isWeapon = true as const;
  momentumX = 0;
  momentumY = 0;
  swoopDirection: 'left' | 'right' = Utils.flipCoin('left', 'right');
  weaponSide = 'enemy' as const;

  private path = new MomentumRunner(
    [
      {
        phase: 'swoop' as const,
        type: 'linear',
        duration: 7,
        variability: 10,
        points: [
          {
            x: -10,
            y: 30,
          },
          {x: -10, y: 15},
          {x: -20, y: -30},
          {x: 25, y: 10},
          {x: 20, y: -20},
        ],
      },
      {
        phase: 'bounce' as const,
        type: 'loop',
        loopCount: 3,
        duration: 5,
        variability: 10,
        points: [
          {x: 0, y: 25},
          {x: 0, y: -25},
        ],
      },
      {
        phase: 'exit' as const,
        type: 'linear',
        duration: 20,
        variability: 0,
        points: [
          {
            x: this.swoopDirection === 'left' ? -150 : +150,
            y: -200,
          },
        ],
      },
    ],
    this
  );
  constructor(game: Game, messageModel: ImpliedEntityType<SwoopingEnemyModel>) {
    super(game, messageModel);
    this.health = messageModel.health;
    this.enemyColor = messageModel.enemyColor;
    this.createPolygon();
    if (!this.game.isClient) {
      this.path.setStartPosition(this.x, this.y);
    }
  }

  get realX() {
    return this.x;
  }

  get realY() {
    return this.y;
  }
  causedDamage(damage: number, otherEntity: Entity): void {}
  causedKill(otherEntity: Entity): void {}

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (isPlayerWeapon(otherEntity)) {
      otherEntity.hurt(
        otherEntity.damage,
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

    return false;
  }

  gameTick(duration: number): void {
    if (
      this.aliveTick % 4 === 0 &&
      (this.path.getCurrentPhase() === 'bounce' || this.path.getCurrentPhase() === 'swoop')
    ) {
      const shotEntity = new EnemyShotEntity(this.game, {entityId: nextId(), x: this.x, y: this.y - 6});
      this.game.entities.push(shotEntity);
    }

    const result = this.path.progress();
    if (result === 'done') {
      this.destroy();
    }
    this.aliveTick++;
  }

  hurt(damage: number, otherEntity: Entity, x: number, y: number) {
    if (!isPlayerWeapon(otherEntity)) {
      return;
    }

    if (this.markToDestroy) {
      return;
    }

    this.health -= damage;
    this.momentumX += x;
    this.momentumY += y;
    otherEntity.causedDamage(otherEntity.damage, this);

    const explosionEntity = new ExplosionEntity(this.game, {
      entityId: nextId(),
      x: otherEntity.x - this.x,
      y: otherEntity.y - this.y,
      intensity: this.explosionIntensity,
      ownerEntityId: this.entityId,
    });
    this.game.entities.push(explosionEntity);
    if (this.health <= 0) {
      this.health = 0;
      otherEntity.causedKill(this);
      const drop = new DropEntity(this.game, {
        entityId: nextId(),
        x: this.x,
        y: this.y,
        drop: DropEntity.randomDrop('big'),
      });
      this.game.entities.push(drop);
      this.game.explode(this, 'medium');
    }
  }

  reconcileFromServer(messageModel: SwoopingEnemyModel) {
    super.reconcileFromServer(messageModel);
    this.health = messageModel.health;
    this.enemyColor = messageModel.enemyColor;
  }

  serialize(): SwoopingEnemyModel {
    return {
      ...super.serialize(),
      health: this.health,
      entityType: 'swoopingEnemy',
      enemyColor: this.enemyColor,
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: SwoopingEnemyModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint8(entity.health);
    buff.addSwitch(entity.enemyColor, {
      black: 1,
      blue: 2,
      green: 3,
      red: 4,
    });
  }

  static randomEnemyColor() {
    return Utils.randomElement(['black' as const, 'blue' as const, 'red' as const, 'green' as const]);
  }

  static readBuffer(reader: ArrayBufferReader): SwoopingEnemyModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'swoopingEnemy' as const,
      health: reader.readUint8(),
      enemyColor: Utils.switchNumber(reader.readUint8(), {
        1: 'black' as const,
        2: 'blue' as const,
        3: 'green' as const,
        4: 'red' as const,
      }),
    };
  }
}

export type SwoopingEnemyModel = EntityModel & {
  enemyColor: EnemyColor;
  entityType: 'swoopingEnemy';
  health: number;
};
