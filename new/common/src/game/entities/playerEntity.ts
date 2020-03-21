import {Polygon, Result} from 'collisions';
import {Utils} from '../../utils/utils';
import {Game} from '../game';
import {Action, LightSerializedEntity, PlayerEntityOptions, SerializedEntity, WorldState} from '../types';
import {GameEntity} from './gameEntity';
import {ISolidEntity} from './ISolidEntity';
import {ShotEntity} from './shotEntity';
import {GameConstants} from '../gameConstants';

export class PlayerEntity extends GameEntity implements ISolidEntity {
  draw(context: CanvasRenderingContext2D): void {}
  shotSpeedPerSecond = 0;

  shipType: string;

  solid: true = true;
  width: number = 64;
  height: number = 48;

  protected speedPerSecond: number;
  protected color: string;
  protected shotStrength: number;
  protected shootEveryTick: number;

  protected msg: string;

  bufferedActions: Action[] = [];
  addAction(action: Action) {
    this.bufferedActions.push(action);
    this.bufferedActions = this.bufferedActions.filter(a => a.actionTick >= action.actionTick - 5);
  }

  get latestAction(): Action {
    return (
      this.bufferedActions.slice(-1)[0] || {
        x: this.x,
        y: this.y,
        controls: {
          shoot: false,
          down: false,
          up: false,
          right: false,
          left: false,
        },
        actionTick: 0,
        entityId: this.id,
      }
    );
  }

  updatePolygon(action: Action = this.latestAction): void {
    if (!this.polygon || !action) {
      return;
    }
    this.polygon.x = Utils.round(action.x, 1);
    this.polygon.y = Utils.round(action.y, 1);
  }

  serialize(): SerializedEntity {
    return {
      type: 'player',
      x: this.x,
      y: this.y,
      id: this.id,
      bufferedActions: this.bufferedActions.slice(-3),
      speedPerSecond: this.speedPerSecond,
      color: this.color,
      shotStrength: this.shotStrength,
      shootEveryTick: this.shootEveryTick,
      shotSpeedPerSecond: this.shotSpeedPerSecond,
      shipType: this.shipType,
      isClient: false,
    };
  }

  serializeLight(): LightSerializedEntity {
    return {
      type: 'player',
      x: this.x,
      y: this.y,
      id: this.id,
      bufferedActions: this.bufferedActions.slice(-3),
    };
  }

  constructor(protected game: Game, options: PlayerEntityOptions) {
    super(game, options);
    this.shotStrength = options.shotStrength;
    this.shotSpeedPerSecond = options.shotSpeedPerSecond;
    this.color = options.color;
    this.speedPerSecond = options.speedPerSecond;
    this.shootEveryTick = options.shootEveryTick;
    this.shipType = options.shipType;

    this.polygon = new Polygon(this.x, this.y, [
      [-this.width / 2, -this.height / 2],
      [this.width / 2, -this.height / 2],
      [this.width / 2, this.height / 2],
      [-this.width / 2, this.height / 2],
    ]);
    this.polygon.entity = this;
    this.game.collisionEngine.insert(this.polygon);
  }

  collide(otherEntity: GameEntity, collisionResult: Result, solidOnly: boolean) {
    if (otherEntity instanceof ShotEntity && this.id !== otherEntity.ownerId) {
      return true;
    }
    if (Utils.isSolidEntity(otherEntity)) {
      this.latestAction.x -= collisionResult.overlap * collisionResult.overlap_x;
      this.latestAction.y -= collisionResult.overlap * collisionResult.overlap_y;
      this.updatePolygon();
    }
    return false;
  }

  serverTick(currentServerTick: number): void {
    const [action] = this.bufferedActions.slice(-1);
    if (!action) {
      return;
    }
    this.processAction(action);
    this.x = action.x;
    this.y = action.y;
  }

  lockTick(currentServerTick: number): void {
    const [action] = this.bufferedActions.slice(-1);
    if (!action) {
      return;
    }
    if (action.controls.shoot) {
      if (action.actionTick % this.shootEveryTick === 0) {
        const shotEntity = new ShotEntity(this.game, {
          tickCreated: action.actionTick,
          x: action.x,
          y: action.y,
          ownerId: this.id,
          strength: this.shotStrength,
          id: Utils.generateId(),
          type: 'shot',
          shotSpeedPerSecond: this.shotSpeedPerSecond,
          isClient: this.isClient,
        });
        this.game.addEntity(shotEntity);
      }
    }
  }

  processAction(action: Action) {
    if (action.controls.left) {
      action.x -= (GameConstants.tickRate / 1000) * this.speedPerSecond;
    }
    if (action.controls.right) {
      action.x += (GameConstants.tickRate / 1000) * this.speedPerSecond;
    }

    if (action.controls.up) {
      action.y -= (GameConstants.tickRate / 1000) * this.speedPerSecond;
    }
    if (action.controls.down) {
      action.y += (GameConstants.tickRate / 1000) * this.speedPerSecond;
    }
    if (action.controls.shoot) {
      if (action.actionTick % this.shootEveryTick === 0) {
        const shotEntity = new ShotEntity(this.game, {
          tickCreated: action.actionTick,
          x: action.x,
          y: action.y,
          ownerId: this.id,
          strength: this.shotStrength,
          id: Utils.generateId(),
          type: 'shot',
          shotSpeedPerSecond: this.shotSpeedPerSecond,
          isClient: this.isClient,
        });
        this.game.addEntity(shotEntity);
      }
    }
  }

  tick(timeSinceLastTick: number, timeSinceLastServerTick: number, currentServerTick: number) {
    const [actionSub2, actionSub1] = this.bufferedActions.slice(-2);
    if (!actionSub2 || !actionSub1) {
      return;
    }
    this.x = actionSub2.x + (actionSub1.x - actionSub2.x) * (timeSinceLastServerTick / GameConstants.tickRate);
    this.y = actionSub2.y + (actionSub1.y - actionSub2.y) * (timeSinceLastServerTick / GameConstants.tickRate);
  }
}
