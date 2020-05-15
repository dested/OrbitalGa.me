import {Result} from 'collisions';
import {Utils} from '../utils/utils';
import {OrbitalGame} from '../game/game';
import {Entity} from '../baseEntities/entity';
import {nextId} from '../utils/uuid';
import {EnemyShotEntity} from './enemyShotEntity';
import {GameRules} from '../game/gameRules';
import {MomentumRunner} from '../utils/momentumRunner';
import {isPlayerWeapon, WeaponEntity} from './weaponEntity';
import {DropEntity} from './dropEntity';
import {ImpliedEntityType} from '../models/serverToClientMessages';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {ScoreEntity} from './scoreEntity';
import {LeaderboardEntryWeight} from '../game/gameLeaderboard';
import {
  ImpliedDefaultPhysics,
  PhysicsEntity,
  PhysicsEntityModel,
  PhysicsEntityModelSchema,
} from '../baseEntities/physicsEntity';

export type EnemyColor = 'black' | 'blue' | 'green' | 'red';

export class SwoopingEnemyEntity extends PhysicsEntity implements WeaponEntity {
  aliveTick: number = 0;
  // width = 112;
  // height = 75;
  boundingBoxes = [
    {width: 112, height: 34, offsetY: 41},
    {width: 57, height: 41, offsetX: 35},
  ];
  damage = 2;
  enemyColor: EnemyColor;
  explosionIntensity = 4;
  health: number = GameRules.enemies.swoopingEnemy.startingHealth;
  hit = false;
  isWeapon = true as const;
  ownerPlayerEntityId: number;
  swoopDirection: 'left' | 'right' = Utils.flipCoin('left', 'right');
  type = 'swoopingEnemy' as const;
  weaponSide = 'enemy' as const;

  private path = new MomentumRunner(
    [
      {
        phase: 'swoop' as const,
        type: 'linear',
        duration: 60,
        variability: 2,
        points: [
          {
            x: -2,
            y: 5,
          },
        ],
      },
      {
        phase: 'bounce' as const,
        type: 'loop',
        loopCount: 6,
        duration: 5 * 10,
        variability: 2,
        points: [
          {x: 0, y: 1},
          {x: 0, y: -3},
        ],
      },
      {
        phase: 'exit' as const,
        type: 'linear',
        duration: 20 * 50,
        variability: 0,
        points: [
          {
            x: this.swoopDirection === 'left' ? -10 : +10,
            y: -15,
          },
        ],
      },
    ],
    this
  );

  constructor(public game: OrbitalGame, messageModel: ImpliedEntityType<ImpliedDefaultPhysics<SwoopingEnemyModel>>) {
    super(game, messageModel);
    this.health = messageModel.health;
    this.enemyColor = messageModel.enemyColor;
    this.ownerPlayerEntityId = messageModel.entityId;
    this.createPolygon();
    this.path.setStartPosition(this.position.x, this.position.y);
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
        (-collisionResult.overlap * collisionResult.overlap_x) / 10,
        (-collisionResult.overlap * collisionResult.overlap_y) / 10
      );

      return true;
    }

    return false;
  }

  gameTick(duration: number): void {
    if (
      !this.game.isClient &&
      this.aliveTick % (4 * 6) === 0 &&
      (this.path.getCurrentPhase() === 'bounce' || this.path.getCurrentPhase() === 'swoop')
    ) {
      const shotEntity = new EnemyShotEntity(this.game, {
        entityId: nextId(),
        position: {x: this.position.x, y: this.position.y - 6},
        ownerEntityId: this.entityId,
      });
      this.game.addObjectToWorld(shotEntity);
    }

    const result = this.path.progress();
    if (result === 'done') {
      this.destroy();
    }
    this.aliveTick++;
  }

  hurt(damage: number, otherEntity: Entity, x: number, y: number) {
    if (this.markToDestroy) {
      return;
    }

    if (!isPlayerWeapon(otherEntity)) {
      return;
    }

    this.hit = true;
    this.bounce(x, y);
    if (!this.game.isClient) {
      this.health -= damage;
      otherEntity.causedDamage(otherEntity.damage, this);
      if (this.health <= 0) {
        this.health = 0;
        otherEntity.causedKill(this);
        const drop = new DropEntity(this.game, {
          entityId: nextId(),
          position: {x: this.position.x, y: this.position.y},
          drop: DropEntity.randomDrop('big'),
        });
        this.game.addObjectToWorld(drop);
        this.game.explode(this, 'medium');
        this.game.addObjectToWorld(
          new ScoreEntity(this.game, {
            entityId: nextId(),
            position: {x: this.position.x, y: this.position.y},
            onlyVisibleToPlayerEntityId: otherEntity.ownerPlayerEntityId,
            score: LeaderboardEntryWeight.enemiesKilled,
          })
        );
      } else {
        this.game.addObjectToWorld(
          new ScoreEntity(this.game, {
            entityId: nextId(),
            position: {x: this.position.x, y: this.position.y},
            onlyVisibleToPlayerEntityId: otherEntity.ownerPlayerEntityId,
            score: LeaderboardEntryWeight.damageGiven,
          })
        );
      }
    }
  }

  postTick() {
    super.postTick();
    this.hit = false;
  }

  reconcileFromServer(messageModel: SwoopingEnemyModel) {
    super.reconcileFromServer(messageModel);
    this.health = messageModel.health;
    this.hit = messageModel.hit;
    this.enemyColor = messageModel.enemyColor;
  }

  serialize(): SwoopingEnemyModel {
    return {
      ...super.serialize(),
      health: this.health,
      type: 'swoopingEnemy',
      hit: this.hit,
      enemyColor: this.enemyColor,
    };
  }

  static randomEnemyColor() {
    return Utils.randomElement(['black' as const, 'blue' as const, 'red' as const, 'green' as const]);
  }
}

class SwoopingEnemyEntityImpl extends SwoopingEnemyEntity {}

export type SwoopingEnemyModel = PhysicsEntityModel & {
  enemyColor: EnemyColor;
  health: number;
  hit: boolean;
  type: 'swoopingEnemy';
};

export const SwoopingEnemyModelSchema: SDTypeElement<SwoopingEnemyModel> = {
  ...PhysicsEntityModelSchema,
  health: 'uint8',
  hit: 'boolean',
  enemyColor: {
    flag: 'enum',
    red: 1,
    green: 2,
    blue: 3,
    black: 4,
  },
};
