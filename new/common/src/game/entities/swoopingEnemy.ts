import {Polygon, Result} from 'collisions';
import {Game} from '../game';
import {EnemyEntityOptions, LightSerializedEntity, SerializedEntity, SwoopingEnemyEntityOptions} from '../types';
import {GameEntity} from './gameEntity';
import {ISolidEntity} from './ISolidEntity';
import {ShotEntity} from './shotEntity';

export class SwoopingEnemyEntity extends GameEntity implements ISolidEntity {
  private color: string;
  private health: number;
  private maxHealth: number;
  width = 40;
  height = 40;
  solid: true = true;

  serverTick(currentServerTick: number): void {}
  lockTick(currentServerTick: number): void {}

  constructor(protected game: Game, private options: SwoopingEnemyEntityOptions) {
    super(game, options);
    this.color = options.color;
    this.health = options.health;
    this.maxHealth = options.health;
    this.polygon = new Polygon(this.x, this.y, [
      [-this.width / 2, -this.height / 2],
      [this.width / 2, -this.height / 2],
      [this.width / 2, this.height / 2],
      [-this.width / 2, this.height / 2],
    ]);
    this.polygon.entity = this;
    this.game.collisionEngine.insert(this.polygon);

    this.startX = this.x;
    this.startY = this.y;
  }

  private startX: number;
  private startY: number;

  tick(timeSinceLastTick: number, timeSinceLastServerTick: number, currentServerTick: number): void {
    this.y = this.startX + Math.sin(currentServerTick / 10) * 50;
    this.x = this.startY + Math.cos(currentServerTick / 10) * 50;
  }

  serialize(): SerializedEntity {
    return {
      type: 'swooping-enemy',
      x: this.x,
      y: this.y,
      id: this.id,
      color: this.color,
      health: this.health,
      isClient: false,
    };
  }

  serializeLight(): LightSerializedEntity {
    return {
      type: 'swooping-enemy',
      x: this.x,
      y: this.y,
      health: this.health,
      id: this.id,
    };
  }

  collide(otherEntity: GameEntity, collisionResult: Result, solidOnly: boolean) {
    if (!solidOnly && otherEntity instanceof ShotEntity) {
      return this.hit(otherEntity.strength);
    }
    return false;
  }

  draw(context: CanvasRenderingContext2D) {
    const x = this.x;
    const y = this.y;
    context.fillStyle = this.color;
    context.fillRect(x - this.width / 2, y - this.height / 2, this.width, this.height);
    context.fillRect(
      x - this.width / 2,
      y + this.height / 4,
      this.width * (this.health / this.maxHealth),
      this.height / 4
    );
  }

  hit(strength: number): boolean {
    this.health -= strength;
    if (this.health <= 0) {
      this.queueDestroy();
      return true;
    }
    return false;
  }

  queueDestroy(): void {
    if (this.isClient) {
      this.clientDeath = true;
    } else {
      this.willDestroy = true;
    }
  }
}
