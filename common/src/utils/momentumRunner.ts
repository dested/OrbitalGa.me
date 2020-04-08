import {Entity} from '../entities/entity';
import {Utils} from './utils';

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
  constructor(private paths: MomentumEntry<TPhase>[], private entity: Entity) {
    this.startX = entity.x;
    this.startY = entity.y;
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
        this.startX = this.entity.x;
        this.startY = this.entity.y;
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

    if (this.entity.momentumX !== curX) {
      const rampSpeed = 10;
      if (this.entity.momentumX > curX) {
        this.entity.momentumX = Math.max(this.entity.momentumX - rampSpeed, curX);
      }
      if (this.entity.momentumX < curX) {
        this.entity.momentumX = Math.min(this.entity.momentumX + rampSpeed, curX);
      }
    }
    if (this.entity.momentumY !== curY) {
      const rampSpeed = 10;
      if (this.entity.momentumY > curY) {
        this.entity.momentumY = Math.max(this.entity.momentumY - rampSpeed, curY);
      }
      if (this.entity.momentumY < curY) {
        this.entity.momentumY = Math.min(this.entity.momentumY + rampSpeed, curY);
      }
    }
    this.entity.x += this.entity.momentumX;
    this.entity.y += this.entity.momentumY;
  }

  private setCurrentVariability() {
    const v = this.paths[this.pathIndex].variability ?? 0;
    this.currentVariabilityX = (v / 2) * Math.random() + v / 2;
    this.currentVariabilityY = (v / 2) * Math.random() + v / 2;
  }
}
