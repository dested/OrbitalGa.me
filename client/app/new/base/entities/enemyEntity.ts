import {Polygon} from 'collisions';
import {Game} from '../game';
import {EnemyEntityOptions, SerializedEntity} from '../types';
import {GameEntity} from './gameEntity';
import {ISolidEntity} from './ISolidEntity';
import {ShotEntity} from './shotEntity';

export class EnemyEntity extends GameEntity implements ISolidEntity {
  private color: string;
  private health: number;
  width = 40;
  height = 40;
  solid: true = true;

  serverTick(currentServerTick: number): void {}

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

  tick(timeSinceLastTick: number, timeSinceLastServerTick: number, currentServerTick: number): void {}

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
