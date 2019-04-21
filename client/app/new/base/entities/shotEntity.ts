import {Polygon} from 'collisions';
import {Game} from '../game';
import {SerializedEntity, ShotEntityOptions} from '../types';
import {EnemyEntity} from './enemyEntity';
import {GameEntity} from './gameEntity';
import {PlayerEntity} from './playerEntity';

export class ShotEntity extends GameEntity {
  shotSpeedPerSecond: number;
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

  serverTick(currentServerTick: number): void {}

  tick(timeSinceLastTick: number, timeSinceLastServerTick: number, currentServerTick: number): void {
    if (currentServerTick - this.tickCreated > 10 * 1000) {
      this.destroy();
      return;
    } else {
      this.y -= (timeSinceLastTick / 1000) * this.shotSpeedPerSecond;
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
