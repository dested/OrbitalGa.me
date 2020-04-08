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

export class SwoopingEnemyEntity extends Entity {
  get realX() {
    return this.x;
  }
  get realY() {
    return this.y;
  }

  // width = 112;
  // height = 75;
  boundingBoxes = [
    {width: 112, height: 34, offsetY: 41},
    {width: 57, height: 41, offsetX: 35},
  ];
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

  constructor(game: Game, entityId: number) {
    super(game, entityId, 'swoopingEnemy');
    this.createPolygon();
  }

  start(x: number, y: number) {
    super.start(x, y);
    this.path.setStartPosition(x, y);
  }

  health: number = GameRules.enemies.swoopingEnemy.startingHealth;
  aliveTick: number = 0;
  gameTick(duration: number): void {
    if (this.health <= 0) {
      this.game.destroyEntity(this);
      return;
    }

    if (
      this.aliveTick % 4 === 0 &&
      (this.path.getCurrentPhase() === 'bounce' || this.path.getCurrentPhase() === 'swoop')
    ) {
      const shotEntity = new EnemyShotEntity(this.game, nextId(), this.entityId);
      shotEntity.start(0, 6);
      this.game.entities.push(shotEntity);
    }

    const result = this.path.progress();
    if (result === 'done') {
      this.game.destroyEntity(this);
    }
    this.aliveTick++;
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof ShotEntity) {
      this.health -= 1;
      this.game.destroyEntity(otherEntity);

      const shotExplosionEntity = new ShotExplosionEntity(this.game, nextId(), this.entityId);
      shotExplosionEntity.start(this.x - otherEntity.realX, this.y - otherEntity.realY);
      this.game.entities.push(shotExplosionEntity);

      return true;
    }
    return false;
  }
  serialize(): SwoopingEnemyModel {
    return {
      ...super.serialize(),
      health: this.health,
      entityType: 'swoopingEnemy',
    };
  }

  reconcileFromServer(messageEntity: SwoopingEnemyModel) {
    super.reconcileFromServer(messageEntity);
    this.health = messageEntity.health;
  }

  static readBuffer(reader: ArrayBufferReader): SwoopingEnemyModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'swoopingEnemy' as const,
      health: reader.readUint8(),
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: SwoopingEnemyModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint8(entity.health);
  }
}

export type SwoopingEnemyModel = EntityModel & {
  entityType: 'swoopingEnemy';
  health: number;
};
