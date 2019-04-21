import {Polygon, Result} from 'collisions';
import {ClientGame} from '../client/clientGame';
import {Utils} from '../utils/utils';
import {Game} from './game';
import {
  Action,
  ActionSubType,
  ActionType,
  EnemyEntityOptions,
  EntityOptions,
  PlayerEntityOptions,
  SerializedEntity,
  ShotEntityOptions,
} from './types';

export abstract class GameEntity {
  polygon: Polygon | null;

  constructor(protected game: Game, options: EntityOptions) {
    this.id = options.id;
    this.x = options.x;
    this.y = options.y;
  }

  x: number;
  y: number;
  id: string;

  abstract serialize(): SerializedEntity;

  destroy(): void {
    this.game.entities.splice(this.game.entities.findIndex(a => a.id === this.id), 1);
    this.game.collisionEngine.remove(this.polygon!);
    this.polygon = null;
  }

  abstract tick(timeSinceLastTick: number, currentServerTick: number): void;

  abstract collide(otherEntity: GameEntity, collisionResult: Result): boolean;

  updatePolygon(): void {
    if (!this.polygon) {
      return;
    }
    this.x = Utils.round(this.x, 1);
    this.y = Utils.round(this.y, 1);
    this.polygon.x = this.x;
    this.polygon.y = this.y;
  }

  abstract draw(context: CanvasRenderingContext2D): void;
}

export class EnemyEntity extends GameEntity implements ISolidEntity {
  private color: string;
  private health: number;
  width = 40;
  height = 40;
  solid: true = true;

  constructor(protected game: Game, private options: EnemyEntityOptions) {
    super(game, options);
    this.color = options.color;
    this.health = options.health;
    this.polygon = new Polygon(this.x, this.y, [
      [-this.width / 2, -this.height / 2],
      [this.width / 2, -this.height / 2],
      [this.width / 2, this.height / 2],
      [-this.width / 2, this.height / 2],
    ]);
    this.polygon.entity = this;
    this.game.collisionEngine.insert(this.polygon);
  }

  tick(timeSinceLastTick: number, currentServerTick: number): void {}

  serialize(): SerializedEntity {
    return {
      type: 'enemy',
      x: this.x,
      y: this.y,
      id: this.id,
      color: this.color,
      health: this.health,
    };
  }

  collide(otherEntity: GameEntity) {
    if (otherEntity instanceof ShotEntity) {
      return this.hit(otherEntity.strength);
    }
    return false;
  }

  draw(context: CanvasRenderingContext2D) {
    const x = (this.x + 500 * 10) % 500;
    const y = (this.y + 500 * 10) % 500;

    context.fillStyle = this.color;
    context.fillRect(x - 20, y - 20, 40, 40);
  }

  hit(strength: number): boolean {
    this.health -= strength;
    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }
}

export class ShotEntity extends GameEntity {
  shotSpeedPerSecond: number;
  private initialY: number;
  ownerId?: string;
  tickCreated: number;
  strength: number;

  width = 6;
  height = 6;

  constructor(protected game: Game, options: ShotEntityOptions) {
    super(game, options);

    this.strength = options.strength;
    this.ownerId = options.ownerId;
    this.tickCreated = options.tickCreated;
    this.initialY = options.initialY;
    this.shotSpeedPerSecond = options.shotSpeedPerSecond;
    this.polygon = new Polygon(this.x, this.y, [
      [-this.width / 2, -this.height / 2],
      [this.width / 2, -this.height / 2],
      [this.width / 2, this.height / 2],
      [-this.width / 2, this.height / 2],
    ]);
    this.polygon.entity = this;
    this.game.collisionEngine.insert(this.polygon);
  }

  tick(timeSinceLastTick: number, currentServerTick: number): void {
    if (currentServerTick - this.tickCreated > 10 * 1000) {
      this.destroy();
      return;
    } else {
      this.y = this.initialY - ((currentServerTick - this.tickCreated) / 1000) * this.shotSpeedPerSecond;
    }
  }

  collide(otherEntity: GameEntity) {
    if (otherEntity instanceof EnemyEntity) {
      this.destroy();
      return true;
    }
    if (otherEntity instanceof PlayerEntity && otherEntity.id !== this.ownerId) {
      this.destroy();
      return true;
    }

    return false;
  }

  serialize(): SerializedEntity {
    return {
      type: 'shot',
      x: this.x,
      y: this.y,
      id: this.id,
      strength: this.strength,
      tickCreated: this.tickCreated,
      ownerId: this.ownerId!,
      initialY: this.initialY,
      shotSpeedPerSecond: this.shotSpeedPerSecond,
    };
  }

  draw(context: CanvasRenderingContext2D) {
    const x = (this.x + 500 * 10) % 500;
    const y = this.y;

    context.fillStyle = 'yellow';
    context.fillRect(x - 3, y - 3, 6, 6);
  }
}

export interface ISolidEntity {
  x: number;
  y: number;
  width: number;
  height: number;
  solid: true;
}

export class PlayerEntity extends GameEntity implements ISolidEntity {
  lastShotTick = 0;
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
      otherEntity.destroy();
      return true;
    }
    if (Utils.isSolidEntity(otherEntity)) {
      this.x -= collisionResult.overlap * collisionResult.overlap_x;
      this.y -= collisionResult.overlap * collisionResult.overlap_y;
      this.updatePolygon();
    }
    return false;
  }

  tick(timeSinceLastTick: number, currentServerTick: number) {
    if (this.lastDownAction[ActionType.Shoot]) {
      for (
        let shotTick = this.lastShotTick + this.shootEveryTick;
        shotTick < currentServerTick;
        shotTick += this.shootEveryTick
      ) {
        const shotX = this.x;
        const shotY = this.y;

        const shotEntity = new ShotEntity(this.game, {
          tickCreated: shotTick,
          x: shotX,
          y: shotY,
          ownerId: this.id,
          initialY: shotY,
          strength: this.shotStrength,
          id: Utils.generateId(),
          type: 'shot',
          shotSpeedPerSecond: this.shotSpeedPerSecond,
        });
        this.game.addEntity(shotEntity);

        this.lastShotTick = shotTick;
      }
    }

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

  processActionUp(message: Action, currentServerTick: number): boolean {
    const lastDown = this.lastDownAction[message.actionType];
    if (!lastDown) {
      return false;
    }
    const tickDiff = currentServerTick - lastDown.actionTick;
    switch (message.actionType) {
      case ActionType.Shoot:
        for (
          let shotTick = this.lastShotTick + this.shootEveryTick;
          shotTick < currentServerTick;
          shotTick += this.shootEveryTick
        ) {
          const shotX = this.x;
          const shotY = this.y;

          const shotEntity = new ShotEntity(this.game, {
            tickCreated: shotTick,
            x: shotX,
            y: shotY,
            ownerId: this.id,
            initialY: shotY,
            strength: this.shotStrength,
            id: Utils.generateId(),
            type: 'shot',
            shotSpeedPerSecond: this.shotSpeedPerSecond,
          });
          this.game.addEntity(shotEntity);
        }

        this.lastShotTick = 0;

        // todo destroy any unduly created shots
        break;
      case ActionType.Left:
        console.log(
          this.x,
          (tickDiff / 1000) * this.speedPerSecond,
          this.x - (tickDiff / 1000) * this.speedPerSecond,
          message.x
        );
        this.x -= (tickDiff / 1000) * this.speedPerSecond;
        break;
      case ActionType.Right:
        this.x += (tickDiff / 1000) * this.speedPerSecond;
        break;
      case ActionType.Up:
        this.y -= (tickDiff / 1000) * this.speedPerSecond;
        break;
      case ActionType.Down:
        this.y += (tickDiff / 1000) * this.speedPerSecond;
        break;
    }
    delete this.lastDownAction[message.actionType];
    return true;
  }

  processActionOther(message: Action, currentServerTick: number): boolean {
    switch (message.actionType) {
      case ActionType.Bomb:
        this.color = 'red';
        break;
    }
    return true;
  }

  processActionDown(message: Action, currentServerTick: number): boolean {
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
      this.lastShotTick =
        this.lastDownAction[ActionType.Shoot].actionTick +
        (this.lastDownAction[ActionType.Shoot].actionTick % this.shootEveryTick);
    }
    return true;
  }

  handleAction(message: Action, currentServerTick: number): boolean {
    switch (message.actionSubType) {
      case ActionSubType.Down: {
        return this.processActionDown(message, currentServerTick);
      }
      case ActionSubType.Up: {
        return this.processActionUp(message, currentServerTick);
      }
      case ActionSubType.Other: {
        return this.processActionOther(message, currentServerTick);
      }
    }
    return false;
  }
}

export class LivePlayerEntity extends PlayerEntity {
  constructor(game: ClientGame, options: PlayerEntityOptions) {
    super(game, options);
  }

  game: ClientGame;

  pressingLeft = false;
  pressingRight = false;
  wasPressingLeft = false;
  wasPressingRight = false;

  pressingShoot = false;
  wasPressingShoot = false;

  pressingUp = false;
  pressingDown = false;
  wasPressingUp = false;
  wasPressingDown = false;

  pressLeft() {
    if (this.pressingRight) {
      return;
    }
    this.pressingLeft = true;
  }

  pressRight() {
    if (this.pressingLeft) {
      return;
    }
    this.pressingRight = true;
  }

  releaseLeft() {
    this.pressingLeft = false;
  }

  releaseRight() {
    this.pressingRight = false;
  }

  pressUp() {
    if (this.pressingDown) {
      return;
    }
    this.pressingUp = true;
  }

  pressDown() {
    if (this.pressingUp) {
      return;
    }
    this.pressingDown = true;
  }

  releaseUp() {
    this.pressingUp = false;
  }

  releaseDown() {
    this.pressingDown = false;
  }

  pressShoot() {
    this.pressingShoot = true;
  }

  releaseShoot() {
    this.pressingShoot = false;
  }

  tick(timeSinceLastTick: number, currentServerTick: number) {
    if (this.pressingShoot) {
      if (!this.wasPressingShoot) {
        this.game.sendAction({
          actionType: ActionType.Shoot,
          actionSubType: ActionSubType.Down,
          x: this.x,
          y: this.y,
          entityId: this.id,
          actionTick: currentServerTick,
        });
        this.lastShotTick = currentServerTick + (currentServerTick % this.shootEveryTick);
        this.wasPressingShoot = true;
      }

      for (
        let shotTick = this.lastShotTick + this.shootEveryTick;
        shotTick < currentServerTick;
        shotTick += this.shootEveryTick
      ) {
        let shotX = this.x;
        let shotY = this.y;

        if (this.lastDownAction[ActionType.Left]) {
          const tickDiff = shotTick - this.lastDownAction[ActionType.Left].actionTick;
          shotX = this.lastDownAction[ActionType.Left].x - (tickDiff / 1000) * this.speedPerSecond;
        } else if (this.lastDownAction[ActionType.Right]) {
          const tickDiff = shotTick - this.lastDownAction[ActionType.Right].actionTick;
          shotX = this.lastDownAction[ActionType.Right].x + (tickDiff / 1000) * this.speedPerSecond;
        }
        if (this.lastDownAction[ActionType.Up]) {
          const tickDiff = shotTick - this.lastDownAction[ActionType.Up].actionTick;
          shotY = this.lastDownAction[ActionType.Up].y - (tickDiff / 1000) * this.speedPerSecond;
        } else if (this.lastDownAction[ActionType.Down]) {
          const tickDiff = shotTick - this.lastDownAction[ActionType.Down].actionTick;
          shotY = this.lastDownAction[ActionType.Down].y + (tickDiff / 1000) * this.speedPerSecond;
        }

        const shotEntity = new ShotEntity(this.game, {
          tickCreated: shotTick,
          x: shotX,
          y: shotY,
          ownerId: this.id,
          initialY: shotY,
          strength: this.shotStrength,
          id: Utils.generateId(),
          type: 'shot',
          shotSpeedPerSecond: this.shotSpeedPerSecond,
        });
        this.game.addEntity(shotEntity);
        this.lastShotTick = shotTick;
      }
    }

    if (this.pressingLeft) {
      if (!this.wasPressingLeft) {
        console.log('a', currentServerTick);
        this.game.sendAction({
          actionType: ActionType.Left,
          actionSubType: ActionSubType.Down,
          x: this.x,
          y: this.y,
          entityId: this.id,
          actionTick: currentServerTick,
        });
        this.wasPressingLeft = true;
      }
      this.x -= (timeSinceLastTick / 1000) * this.speedPerSecond;
    }
    if (this.pressingRight) {
      if (!this.wasPressingRight) {
        this.game.sendAction({
          actionType: ActionType.Right,
          actionSubType: ActionSubType.Down,
          x: this.x,
          y: this.y,
          entityId: this.id,
          actionTick: currentServerTick,
        });
        this.wasPressingRight = true;
      }
      this.x += (timeSinceLastTick / 1000) * this.speedPerSecond;
    }

    if (this.pressingUp) {
      if (!this.wasPressingUp) {
        this.game.sendAction({
          actionType: ActionType.Up,
          actionSubType: ActionSubType.Down,
          x: this.x,
          y: this.y,
          entityId: this.id,
          actionTick: currentServerTick,
        });
        this.wasPressingUp = true;
      }
      this.y -= (timeSinceLastTick / 1000) * this.speedPerSecond;
    }
    if (this.pressingDown) {
      if (!this.wasPressingDown) {
        this.game.sendAction({
          actionType: ActionType.Down,
          actionSubType: ActionSubType.Down,
          x: this.x,
          y: this.y,
          entityId: this.id,
          actionTick: currentServerTick,
        });
        this.wasPressingDown = true;
      }
      this.y += (timeSinceLastTick / 1000) * this.speedPerSecond;
    }

    if (!this.pressingShoot) {
      if (this.wasPressingShoot) {
        this.game.sendAction({
          actionType: ActionType.Shoot,
          actionSubType: ActionSubType.Up,
          x: this.x,
          y: this.y,
          entityId: this.id,
          actionTick: currentServerTick,
        });
        this.wasPressingShoot = false;
      }
    }

    if (!this.pressingLeft) {
      if (this.wasPressingLeft) {
        console.log('b', currentServerTick);
        this.game.sendAction({
          actionType: ActionType.Left,
          actionSubType: ActionSubType.Up,
          x: this.x,
          y: this.y,
          entityId: this.id,
          actionTick: currentServerTick,
        });
        this.wasPressingLeft = false;
      }
    }
    if (!this.pressingRight) {
      if (this.wasPressingRight) {
        this.game.sendAction({
          actionType: ActionType.Right,
          actionSubType: ActionSubType.Up,
          x: this.x,
          y: this.y,
          entityId: this.id,
          actionTick: currentServerTick,
        });
        this.wasPressingRight = false;
      }
    }

    if (!this.pressingUp) {
      if (this.wasPressingUp) {
        this.game.sendAction({
          actionType: ActionType.Up,
          actionSubType: ActionSubType.Up,
          x: this.x,
          y: this.y,
          entityId: this.id,
          actionTick: currentServerTick,
        });
        this.wasPressingUp = false;
      }
    }
    if (!this.pressingDown) {
      if (this.wasPressingDown) {
        this.game.sendAction({
          actionType: ActionType.Down,
          actionSubType: ActionSubType.Up,
          x: this.x,
          y: this.y,
          entityId: this.id,
          actionTick: currentServerTick,
        });
        this.wasPressingDown = false;
      }
    }
  }
}
