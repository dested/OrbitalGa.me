import {Entity} from '../baseEntities/entity';
import {PhysicsEntity} from '../baseEntities/physicsEntity';

type MomentumPoint = {x: number; y: number};
export type MomentumEntry<TPhase> = {
  duration: number;
  phase: TPhase;
  points: MomentumPoint[];
  variability?: number;
} & ({type: 'linear'} | {loopCount: number; type: 'loop'});

export class MomentumRunner<TPhase> {
  currentVariabilityX = 0;
  currentVariabilityY = 0;

  loopCount = 0;
  pathIndex = 0;
  pathPoint: number;

  startX: number;
  startY: number;

  ticks = 0;
  constructor(private paths: MomentumEntry<TPhase>[], private entity: PhysicsEntity) {
    this.startX = entity.position.x;
    this.startY = entity.position.y;
    this.pathPoint = 0;

    this.setCurrentVariability();
  }

  getCurrentPhase(): TPhase | 'done' {
    if (this.paths.length === this.pathIndex) {
      return 'done';
    }
    return this.paths[this.pathIndex].phase;
  }

  progress(): 'done' | 'not-done' {
    if (this.paths.length <= this.pathIndex) {
      return 'done';
    }
    const pathEntry = this.paths[this.pathIndex];

    const points = pathEntry.points;

    this.progressMomentum(points, pathEntry);

    this.ticks++;
    if (this.ticks % pathEntry.duration === 0) {
      this.pathPoint++;
      this.ticks = 0;
      if (this.pathPoint >= points.length) {
        this.pathPoint = 0;

        if (pathEntry.type === 'loop') {
          this.loopCount++;
          if (this.loopCount < pathEntry.loopCount) {
            return 'not-done';
          }
        }

        this.loopCount = 0;
        this.pathIndex++;
        this.pathPoint = 0;
        if (this.paths.length === this.pathIndex) {
          return 'done';
        }
        this.startX = this.entity.position.x;
        this.startY = this.entity.position.y;
        this.setCurrentVariability();
      }
    }
    return 'not-done';
  }

  setStartPosition(x: number, y: number) {
    this.startX = x;
    this.startY = y;
  }

  private progressMomentum(points: MomentumPoint[], pathEntry: MomentumEntry<TPhase>) {
    const curPoint = points[this.pathPoint];

    const curX = curPoint.x + this.currentVariabilityX;
    const curY = curPoint.y + this.currentVariabilityY;

    if (this.entity.velocity.x !== curX) {
      const rampSpeed = 10;
      if (this.entity.velocity.x > curX) {
        this.entity.velocity.x = Math.max(this.entity.velocity.x - rampSpeed, curX);
      }
      if (this.entity.velocity.x < curX) {
        this.entity.velocity.x = Math.min(this.entity.velocity.x + rampSpeed, curX);
      }
    }
    if (this.entity.velocity.y !== curY) {
      const rampSpeed = 10;
      if (this.entity.velocity.y > curY) {
        this.entity.velocity.y = Math.max(this.entity.velocity.y - rampSpeed, curY);
      }
      if (this.entity.velocity.y < curY) {
        this.entity.velocity.y = Math.min(this.entity.velocity.y + rampSpeed, curY);
      }
    }
    this.entity.position.x += this.entity.velocity.x;
    this.entity.position.y += this.entity.velocity.y;
  }

  private setCurrentVariability() {
    const v = this.paths[this.pathIndex].variability ?? 0;
    this.currentVariabilityX = (v / 2) * Math.random() + v / 2;
    this.currentVariabilityY = (v / 2) * Math.random() + v / 2;
  }
}
