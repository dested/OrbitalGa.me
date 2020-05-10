import {Collisions, Result} from 'collisions';
import {Entity} from '../baseEntities/entity';
import {ArrayHash} from '../utils/arrayHash';
import {nextId} from '../utils/uuid';
import {ExplosionEntity} from '../entities/explosionEntity';
import {EntityClusterer} from '../../../server/src/game/entityClusterer';
import {GameLeaderboard} from './gameLeaderboard';
import {PlayerEntity} from '../entities/playerEntity';
import {assertType} from '../utils/utils';
import {PhysicsEntity} from '../baseEntities/physicsEntity';
import {PlayerKeyInput} from '../../../client/src/game/synchronizer/extrapolateStrategy';

export abstract class Game {
  clientPlayerId?: number;
  collisionEngine: Collisions;
  readonly collisionResult: Result;
  entities = new ArrayHash<Entity>('entityId');
  entityClusterer: EntityClusterer;
  gameLeaderboard: any = null;
  highestServerStep?: number;
  stepCount: number = 0;
  totalPlayers: number = 0;

  constructor(public isClient: boolean) {
    this.collisionEngine = new Collisions();
    this.collisionResult = this.collisionEngine.createResult();
    this.entityClusterer = new EntityClusterer(this.entities, 3);
  }

  addObjectToWorld(curObj: Entity) {
    this.entities.push(curObj);
  }

  getPlayerRange(padding: number, filter: (e: Entity) => boolean) {
    const range = {x0: Number.POSITIVE_INFINITY, x1: Number.NEGATIVE_INFINITY};
    const playerEntities = this.entities.filter(filter) as PhysicsEntity[];

    if (playerEntities.length === 0) {
      return {x0: -padding, x1: padding};
    }
    for (const entity of playerEntities) {
      range.x0 = Math.min(range.x0, entity.position.x);
      range.x1 = Math.max(range.x1, entity.position.x);
    }
    return {x0: range.x0 - padding, x1: range.x1 + padding};
  }

  abstract postTick(tickIndex: number, duration: number): void;

  processInput(inputDesc: PlayerKeyInput, playerId: number) {}

  abstract step(reenact: boolean, tickIndex: number, duration: number): void;

  protected checkCollisions() {
    this.collisionEngine.update();

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities.getIndex(i);
      if (entity instanceof PhysicsEntity) {
        entity.checkCollisions();
      }
    }
  }
}

export class OrbitalGame extends Game {
  explode(entity: PhysicsEntity, explosionSize: 'small' | 'medium' | 'big') {
    entity.destroy();
    if (!this.isClient) {
      let size = 0;
      switch (explosionSize) {
        case 'small':
          size = 3;
          break;
        case 'medium':
          size = 5;
          break;
        case 'big':
          size = 8;
          break;
      }
      for (let i = 0; i < size; i++) {
        const deathExplosion = new ExplosionEntity(this, {
          entityId: nextId(),
          x: entity.position.x - entity.boundingBoxes[0].width / 2 + Math.random() * entity.boundingBoxes[0].width,
          y: entity.position.y - entity.boundingBoxes[0].height / 2 + Math.random() * entity.boundingBoxes[0].height,
          intensity: 2,
        });
        this.entities.push(deathExplosion);
      }
    }
  }

  killPlayer(player: PlayerEntity): void {
    // todo emit this.gameLeaderboard!.removePlayer(player.entityId);
    for (const user of this.users.array) {
      if (user.entity === player) {
        user.deadXY = {x: player.realX, y: player.realY};
        user.entity = undefined;
        break;
      }
    }
  }

  postTick(tickIndex: number, duration: number): void {
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities.getIndex(i);
      if (entity.markToDestroy) {
        if (entity instanceof PlayerEntity) {
          this.killPlayer(entity);
        }
        this.entities.remove(entity);
      } else {
        entity.postTick();
      }
    }
  }

  step(replay: boolean, tickIndex: number, duration: number): void {
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities.array[i];
      entity.gameTick(duration);
      if (entity instanceof PhysicsEntity) {
        entity.updatePolygon();
      }
    }

    this.checkCollisions();
  }
}
