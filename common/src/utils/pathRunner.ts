import {Entity} from '../baseEntities/entity';
import {Utils} from './utils';

type PathPoint = {offset?: 'currentPosition' | 'static' | 'staticX' | 'staticY'; x: number; y: number};
export type Path<TPhase> = {
  duration: number;
  phase: TPhase;
  points: PathPoint[];
} & ({type: 'linear'} | {loopCount: number; type: 'loop'});

export class PathRunner<TPhase> {
  loopCount = 0;
  pathIndex = 0;
  pathPoint: number;

  startX: number;
  startY: number;

  ticks = 0;
  constructor(private paths: Path<TPhase>[], private entity: Entity) {
    this.startX = entity.x;
    this.startY = entity.y;
    this.pathPoint = 1;
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

    this.progressPosition(points, pathEntry);

    this.ticks++;
    if (this.ticks % pathEntry.duration === 0) {
      this.pathPoint++;
      this.ticks = 0;
      if (this.pathPoint >= points.length) {
        this.pathPoint = 1;

        if (pathEntry.type === 'loop') {
          this.loopCount++;
          if (this.loopCount < pathEntry.loopCount) {
            return 'not-done';
          }
        }

        this.loopCount = 0;
        this.pathIndex++;
        this.pathPoint = 1;
        if (this.paths.length === this.pathIndex) {
          return 'done';
        }
        this.startX = this.entity.x;
        this.startY = this.entity.y;
      }
    }
    return 'not-done';
  }

  setStartPosition(x: number, y: number) {
    this.startX = x;
    this.startY = y;
  }

  private progressPosition(points: PathPoint[], pathEntry: Path<TPhase>) {
    const prevPoint = points[this.pathPoint - 1];
    const curPoint = points[this.pathPoint];

    let prevX = prevPoint.x;
    let prevY = prevPoint.y;
    switch (prevPoint.offset || 'currentPosition') {
      case 'currentPosition':
        prevX += this.startX;
        prevY += this.startY;
        break;
      case 'static':
        break;
      case 'staticX':
        prevY += this.startY;
        break;
      case 'staticY':
        prevX += this.startX;
        break;
    }

    let curX = curPoint.x;
    let curY = curPoint.y;

    switch (curPoint.offset || 'currentPosition') {
      case 'currentPosition':
        curX += this.startX;
        curY += this.startY;
        break;
      case 'static':
        break;
      case 'staticX':
        curY += this.startY;
        break;
      case 'staticY':
        curX += this.startX;
        break;
    }

    this.entity.x = Utils.lerp(prevX, curX, this.ticks / pathEntry.duration);
    this.entity.y = Utils.lerp(prevY, curY, this.ticks / pathEntry.duration);
  }
}
