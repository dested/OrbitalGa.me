import {Result} from 'collisions';
import {Utils} from '../utils/utils';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ShotEntity} from './shotEntity';
import {GameConstants} from '../game/gameConstants';
import {ShotExplosionEntity} from './shotExplosionEntity';
import {nextId} from '../utils/uuid';
import {EnemyShotEntity} from './enemyShotEntity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {PathRunner} from '../utils/pathRunner';
import {GameRules} from '../game/gameRules';
import {PlayerEntity} from './playerEntity';
import {PlayerShieldEntity} from './playerShieldEntity';

export type EnemyColor = 'black' | 'blue' | 'green' | 'red';

export class SwoopingEnemyEntity extends Entity {
  aliveTick: number = 0;

  // width = 112;
  // height = 75;
  boundingBoxes = [
    {width: 112, height: 34, offsetY: 41},
    {width: 57, height: 41, offsetX: 35},
  ];

  health: number = GameRules.enemies.swoopingEnemy.startingHealth;
  swoopDirection: 'left' | 'right' = Utils.flipCoin('left', 'right');
  private path = new PathRunner(
    [
      {
        phase: 'swoop' as const,
        type: 'linear',
        duration: 5,
        points: [
          {x: 0, y: 0},
          {
            x: -GameConstants.screenSize.width * 0.1,
            y: GameConstants.screenSize.height * 0.4,
          },
          {x: -GameConstants.screenSize.width * 0.2, y: GameConstants.screenSize.height * 0.5},
          {x: -GameConstants.screenSize.width * 0.1, y: GameConstants.screenSize.height * 0.5},
          {x: 0, y: GameConstants.screenSize.height * 0.4},
          {x: GameConstants.screenSize.width * 0.1, y: GameConstants.screenSize.height * 0.6},
          {x: GameConstants.screenSize.width * 0.2, y: GameConstants.screenSize.height * 0.5},
        ],
      },
      {
        phase: 'bounce' as const,
        type: 'loop',
        loopCount: 3,
        duration: 5,
        points: [
          {x: 0, y: GameConstants.screenSize.height * 0.1},
          {x: 0, y: -GameConstants.screenSize.height * 0.1},
          {x: 0, y: GameConstants.screenSize.height * 0.1},
        ],
      },
      {
        phase: 'exit' as const,
        type: 'linear',
        duration: 10,
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x:
              this.swoopDirection === 'left'
                ? -GameConstants.screenSize.width * 1.2
                : +GameConstants.screenSize.width * 1.2,
            y: -GameConstants.screenSize.height * 0.1,
            offset: 'staticY',
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
    if (otherEntity instanceof ShotEntity) {
      this.health -= 1;
      this.game.destroyEntity(otherEntity);

      const shotExplosionEntity = new ShotExplosionEntity(this.game, nextId(), 3, this.entityId);
      shotExplosionEntity.start(this.x - otherEntity.realX, this.y - otherEntity.realY);
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

  reconcileFromServer(messageEntity: SwoopingEnemyModel) {
    super.reconcileFromServer(messageEntity);
    this.health = messageEntity.health;
    this.enemyColor = messageEntity.enemyColor;
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
      const deathExplosion = new ShotExplosionEntity(this.game, nextId(), 2);
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
