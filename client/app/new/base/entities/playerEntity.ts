import {Polygon, Result} from 'collisions';
import {Utils} from '../../utils/utils';
import {Game} from '../game';
import {Action, ActionType, PlayerEntityOptions, SerializedEntity} from '../types';
import {GameEntity} from './gameEntity';
import {ISolidEntity} from './ISolidEntity';
import {ShotEntity} from './shotEntity';

export class PlayerEntity extends GameEntity implements ISolidEntity {
  shotSpeedPerSecond = 0;

  solid: true = true;
  width: number = 20;
  height: number = 20;

  protected speedPerSecond: number;
  protected color: string;
  protected shotStrength: number;
  protected shootEveryTick: number;
  lastDownAction: {[action in ActionType]?: Action} = {};

  serialize(): SerializedEntity {
    return {
      type: 'player',
      x: this.x,
      y: this.y,
      id: this.id,
      lastDownAction: this.lastDownAction,
      speedPerSecond: this.speedPerSecond,
      color: this.color,
      shotStrength: this.shotStrength,
      shootEveryTick: this.shootEveryTick,
      shotSpeedPerSecond: this.shotSpeedPerSecond,
    };
  }

  constructor(protected game: Game, options: PlayerEntityOptions) {
    super(game, options);
    this.shotStrength = options.shotStrength;
    this.shotSpeedPerSecond = options.shotSpeedPerSecond;
    this.color = options.color;
    this.speedPerSecond = options.speedPerSecond;
    this.shootEveryTick = options.shootEveryTick;

    this.polygon = new Polygon(this.x, this.y, [
      [-this.width / 2, -this.height / 2],
      [this.width / 2, -this.height / 2],
      [this.width / 2, this.height / 2],
      [-this.width / 2, this.height / 2],
    ]);
    this.polygon.entity = this;
    this.game.collisionEngine.insert(this.polygon);
  }

  collide(otherEntity: GameEntity, collisionResult: Result) {
    if (otherEntity instanceof ShotEntity && this.id !== otherEntity.ownerId) {
      return true;
    }
    if (Utils.isSolidEntity(otherEntity)) {
      this.x -= collisionResult.overlap * collisionResult.overlap_x;
      this.y -= collisionResult.overlap * collisionResult.overlap_y;
      this.updatePolygon();
    }
    return false;
  }

  lockTick(currentServerTick: number): void {}

  tick(timeSinceLastTick: number, currentServerTick: number) {
    if (this.lastDownAction[ActionType.Left]) {
      this.x -= (timeSinceLastTick / 1000) * this.speedPerSecond;
      this.lastDownAction[ActionType.Left].actionTick = currentServerTick;
    }

    if (this.lastDownAction[ActionType.Right]) {
      this.x += (timeSinceLastTick / 1000) * this.speedPerSecond;
      this.lastDownAction[ActionType.Right].actionTick = currentServerTick;
    }

    if (this.lastDownAction[ActionType.Up]) {
      this.y -= (timeSinceLastTick / 1000) * this.speedPerSecond;
      this.lastDownAction[ActionType.Up].actionTick = currentServerTick;
    }
    if (this.lastDownAction[ActionType.Down]) {
      this.y += (timeSinceLastTick / 1000) * this.speedPerSecond;
      this.lastDownAction[ActionType.Down].actionTick = currentServerTick;
    }
  }

  draw(context: CanvasRenderingContext2D) {
    const x = (this.x + 500 * 10) % 500;
    const y = (this.y + 500 * 10) % 500;
    context.fillStyle = 'white';
    context.font = '20px Arial';
    context.fillText(`${this.x.toFixed()},${this.y.toFixed()}`, x, y - 10);
    context.fillStyle = this.color;
    context.fillRect(x - 10, y - 10, 20, 20);
  }

  processAction(message: Action, currentServerTick: number): boolean {
    if (message.actionType === ActionType.Left && this.lastDownAction[ActionType.Right]) {
      return false;
    }
    if (message.actionType === ActionType.Right && this.lastDownAction[ActionType.Left]) {
      return false;
    }
    if (message.actionType === ActionType.Down && this.lastDownAction[ActionType.Up]) {
      return false;
    }
    if (message.actionType === ActionType.Up && this.lastDownAction[ActionType.Down]) {
      return false;
    }
    this.lastDownAction[message.actionType] = message;
    if (message.actionType === ActionType.Shoot) {
      const shotEntity = new ShotEntity(this.game, {
        tickCreated: message.actionTick,
        x: message.x,
        y: message.y,
        ownerId: this.id,
        strength: this.shotStrength,
        id: message.id,
        type: 'shot',
        shotSpeedPerSecond: this.shotSpeedPerSecond,
      });
      this.game.addEntity(shotEntity);
    }
    return true;
  }

  handleAction(message: Action, currentServerTick: number): boolean {
    return this.processAction(message, currentServerTick);
  }
}
