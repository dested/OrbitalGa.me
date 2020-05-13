import {Collisions, Result} from 'collisions';
import {Entity, EntityModel} from '../baseEntities/entity';
import {ArrayHash} from '../utils/arrayHash';
import {ExplosionEntity} from '../entities/explosionEntity';
import {EntityClusterer} from '../../../server/src/game/entityClusterer';
import {PlayerEntity} from '../entities/playerEntity';
import {PhysicsEntity} from '../baseEntities/physicsEntity';
import {SpectatorEntity} from '../entities/spectatorEntity';
import {CTOSPlayerInput} from '../models/clientToServerMessages';
import {TwoVector} from '../utils/twoVector';
import {EntityModels} from '../models/serverToClientMessages';
import {nextId} from '../utils/uuid';
import {EntityUtils} from '../utils/entityUtils';
import {EntityTypes} from '../entities/entityTypes';
const dx = new TwoVector(0, 0);

export abstract class Game {
  clientPlayerId?: number;
  collisionEngine: Collisions;
  readonly collisionResult: Result;
  entities = new ArrayHash<Entity>('entityId');
  entityClusterer: EntityClusterer;
  // todo leaderboard, remember we want to emit leaderbaord stuff back to engine
  gameLeaderboard: any = null;
  highestServerStep?: number;
  stepCount: number = 0;
  totalPlayers: number = 0;
  engine!: Engine;
  constructor(public isClient: boolean) {
    this.collisionEngine = new Collisions();
    this.collisionResult = this.collisionEngine.createResult();
    this.entityClusterer = new EntityClusterer(this.entities, 3);
    // this.timer = new Timer(); todo timer
    // this.timer.play();
  }

  get clientPlayer(): PlayerEntity | undefined {
    if (this.clientPlayerId) {
      return this.entities.lookup<PlayerEntity>(this.clientPlayerId);
    }
    return undefined;
  }

  get spectatorEntity(): SpectatorEntity | undefined {
    return this.entities.filter((a) => a.type === 'spectator')[0] as SpectatorEntity | undefined;
  }

  addObjectToWorld(entity: Entity, instantiatedFromSync: boolean = false) {
    if (this.isClient && !instantiatedFromSync) {
      entity.entityId += 1000000;
    }
    this.engine.assignActor(entity);
    this.entities.push(entity);
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

  abstract instantiateEntity(messageModel: EntityModels): Entity;

  physicsStep(isReenact: boolean, dt?: number) {
    dt = dt ?? 1;
    for (const entity of this.entities.array) {
      // skip physics for shadow objects during re-enactment
      if (isReenact && EntityUtils.isShadowEntity(entity)) {
        continue;
      }
      if (entity instanceof PhysicsEntity) {
        // physics
        const velMagnitude = entity.velocity.length();
        if (entity.maxSpeed && velMagnitude > entity.maxSpeed) {
          entity.velocity.multiplyScalar(entity.maxSpeed / velMagnitude);
        }
        dx.copy(entity.velocity).multiplyScalar(dt);
        entity.position.add(dx);

        entity.velocity.multiply(entity.friction);

        entity.updatePolygon();
      }
    }

    this.checkCollisions();
  }

  abstract postTick(tickIndex: number, duration: number): void;

  processInput(inputDesc: CTOSPlayerInput, playerId: number) {
    this.entities.lookup<PlayerEntity>(playerId)?.applyInput(inputDesc);
  }
  setEngine(engine: Engine) {
    this.engine = engine;
  }

  step(isReenact: boolean, dt?: number, physicsOnly?: boolean): void {
    if (physicsOnly) {
      if (dt) dt /= 1000; // physics engines work in seconds
      this.physicsStep(isReenact, dt);
      return;
    }

    const step = ++this.stepCount;

    if (dt) dt /= 1000; // physics engines work in seconds
    this.physicsStep(isReenact, dt);

    /*
    if (!isReenact) {
      this.timer.tick();
    }
*/
  }

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

export abstract class Engine {
  abstract assignActor(entity: Entity): void;
  abstract killPlayer(player: Entity): void;
  abstract setDebug(key: string, value: number | string): void;
}

export class OrbitalGame extends Game {
  constructor(isClient: boolean) {
    super(isClient);
  }

  explode(entity: PhysicsEntity, explosionSize: 'small' | 'medium' | 'big') {
    entity.destroy();
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
        position: {
          x: entity.position.x - entity.boundingBoxes[0].width / 2 + Math.random() * entity.boundingBoxes[0].width,
          y: entity.position.y - entity.boundingBoxes[0].height / 2 + Math.random() * entity.boundingBoxes[0].height,
        },
        intensity: 2,
      });
      this.addObjectToWorld(deathExplosion);
    }
  }

  instantiateEntity(messageModel: EntityModels): Entity {
    const curObj = new EntityTypes[messageModel.type](this, messageModel as any);
    curObj.reconcileFromServer(messageModel as any); // todo any
    return curObj;
  }

  postTick(tickIndex: number, duration: number): void {
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities.getIndex(i);
      if (entity.markToDestroy) {
        if (entity instanceof PlayerEntity) {
          this.engine.killPlayer(entity);
        }
        this.entities.remove(entity);
      } else {
        entity.postTick();
      }
    }
  }

  step(isReenact: boolean, dt?: number, physicsOnly?: boolean): void {
    super.step(isReenact, dt, physicsOnly);
    if (physicsOnly) return;
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities.array[i];
      entity.gameTick(dt ?? 1);
    }
  }
}
