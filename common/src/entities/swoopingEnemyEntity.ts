import {Result} from 'collisions';
import {Utils} from '../utils/utils';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ExplosionEntity} from './explosionEntity';
import {nextId} from '../utils/uuid';
import {EnemyShotEntity} from './enemyShotEntity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {GameRules} from '../game/gameRules';
import {PlayerEntity} from './playerEntity';
import {MomentumRunner} from '../utils/momentumRunner';
import {isPlayerWeapon, Weapon} from './weapon';

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
  explosionIntensity = 4;
  health: number = GameRules.enemies.swoopingEnemy.startingHealth;
  isWeapon = true as const;
  momentumX = 0;
  momentumY = 0;
  side = 'enemy' as const;

  swoopDirection: 'left' | 'right' = Utils.flipCoin('left', 'right');
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

  constructor(game: Game, entityId: number, public enemyColor: EnemyColor) {
    super(game, entityId, 'swoopingEnemy');
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
      this.health -= otherEntity.damage;
      this.game.destroyEntity(otherEntity);

      const explosionEntity = new ExplosionEntity(this.game, nextId(), otherEntity.explosionIntensity, this.entityId);
      explosionEntity.start(this.x - otherEntity.realX, this.y - otherEntity.realY);
      this.game.entities.push(explosionEntity);
      if (this.health <= 0) {
        this.die();
      }
      return true;
    }

    if (otherEntity instanceof PlayerEntity) {
      if (
        otherEntity.hurt(
          otherEntity.damage,
          this,
          collisionResult.overlap * collisionResult.overlap_x,
          collisionResult.overlap * collisionResult.overlap_y
        )
      ) {
        otherEntity.momentumX += collisionResult.overlap * collisionResult.overlap_x * 2;
        otherEntity.momentumY += collisionResult.overlap * collisionResult.overlap_y * 2;
        this.momentumX -= collisionResult.overlap * collisionResult.overlap_x * 2;
        this.momentumY -= collisionResult.overlap * collisionResult.overlap_y * 2;
        this.health -= otherEntity.damage;
        if (this.health <= 0) {
          this.die();
        }
        return true;
      }
    }
    return false;
  }

  gameTick(duration: number): void {
    if (
      this.aliveTick % 4 === 0 &&
      (this.path.getCurrentPhase() === 'bounce' || this.path.getCurrentPhase() === 'swoop')
    ) {
      const shotEntity = new EnemyShotEntity(this.game, nextId());
      shotEntity.start(this.x, this.y - 6);
      this.game.entities.push(shotEntity);
    }

    const result = this.path.progress();
    if (result === 'done') {
      this.game.destroyEntity(this);
    }
    this.aliveTick++;
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

  start(x: number, y: number) {
    super.start(x, y);
    this.path.setStartPosition(x, y);
  }

  private die() {
    this.game.destroyEntity(this);

    for (let i = 0; i < 5; i++) {
      const deathExplosion = new ExplosionEntity(this.game, nextId(), 2);
      deathExplosion.start(
        this.x - this.boundingBoxes[0].width / 2 + Math.random() * this.boundingBoxes[0].width,
        this.y - this.boundingBoxes[0].height / 2 + Math.random() * this.boundingBoxes[0].height
      );
      this.game.entities.push(deathExplosion);
    }
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: SwoopingEnemyModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint8(entity.health);
    buff.addUint8(
      Utils.switchType(entity.enemyColor, {
        black: 1,
        blue: 2,
        green: 3,
        red: 4,
      })
    );
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
