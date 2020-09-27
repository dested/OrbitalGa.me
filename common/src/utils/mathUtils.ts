import {TwoVector} from './twoVector';
import {PhysicsEntity} from '../baseEntities/physicsEntity';

export class MathUtils {
  static distance(x1: number, y1: number, x2: number, y2: number) {
    const a = x1 - x2;
    const b = y1 - y2;

    return Math.sqrt(a * a + b * b);
  }

  static distanceObj(a: {x: number; y: number}, b: {x: number; y: number}) {
    const aa = a.x - b.x;
    const bb = a.y - b.y;

    return Math.sqrt(aa * aa + bb * bb);
  }
  static inCircle(x: number, y: number, bx: number, by: number, bradius: number) {
    return Math.sqrt((bx - x) * (bx - x) + (by - y) * (by - y)) < bradius;
  }

  static inSquare(x: number, y: number, bx: number, by: number, bw: number, bh: number) {
    return x > bx && x < bx + bw && y > by && y < by + bh;
  }
  static interpolateDeltaWithWrapping(start: number, end: number, percent: number, wrapMin: number, wrapMax: number) {
    const wrapTest = wrapMax - wrapMin;
    if (start - end > wrapTest / 2) end += wrapTest;
    else if (end - start > wrapTest / 2) start += wrapTest;
    if (Math.abs(start - end) > wrapTest / 3) {
      console.log('wrap interpolation is close to limit.  Not sure which edge to wrap to.');
    }
    return (end - start) * percent;
  }

  static makeSquare(x: number, y: number, width: number, height: number) {
    return {x, y, width, height};
  }

  static mathSign(f: number) {
    if (f < 0) {
      return -1;
    } else if (f > 0) {
      return 1;
    }
    return 0;
  }

  static overlapCircles(
    left: {radius: number; x: number; y: number},
    right: {radius: number; x: number; y: number},
    additionalRadius: number = 0
  ) {
    const distSq = (left.x - right.x) * (left.x - right.x) + (left.y - right.y) * (left.y - right.y);
    const radSumSq =
      (left.radius + additionalRadius + (right.radius + additionalRadius)) *
      (left.radius + additionalRadius + (right.radius + additionalRadius));
    return distSq === radSumSq || distSq <= radSumSq;
  }

  static overlapSquare(point: {x: number; y: number}, box: {height: number; width: number; x: number; y: number}) {
    return this.inSquare(point.x, point.y, box.x, box.y, box.width, box.height);
  }
  static randomItem<T>(item: T[]): T {
    return item[Math.floor(Math.random() * item.length)];
  }

  static randomPad(len: number, paddingPercent: number) {
    const padding = len * paddingPercent;
    return Math.random() * (len - padding * 2) + padding;
  }

  static sum(numbers: number[]) {
    let sum = 0;
    for (const n of numbers) {
      sum += n;
    }
    return sum;
  }
  static sumC<T>(numbers: T[], callback: (t: T) => number) {
    let sum = 0;
    for (const n of numbers) {
      sum += callback(n);
    }
    return sum;
  }

  static rotate(velocity: {x: number; y: number}, angle: number) {
    return {
      x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
      y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle),
    };
  }

  static resolveCollision(particle: PhysicsEntity, otherParticle: PhysicsEntity) {
    if (particle.mass === 0 || otherParticle.mass === 0) return;
    const xVelocityDiff = particle.velocity.x - otherParticle.velocity.x;
    const yVelocityDiff = particle.velocity.y - otherParticle.velocity.y;

    const xDist = otherParticle.position.x - particle.position.x;
    const yDist = otherParticle.position.y - particle.position.y;

    // Prevent accidental overlap of particles
    if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
      // Grab angle between the two colliding particles
      const angle = -Math.atan2(
        otherParticle.position.y - particle.position.y,
        otherParticle.position.x - particle.position.x
      );

      // Store mass in var for better readability in collision equation
      const m1 = particle.mass;
      const m2 = otherParticle.mass;

      // Velocity before equation
      const u1 = this.rotate(particle.velocity, angle);
      const u2 = this.rotate(otherParticle.velocity, angle);

      // Velocity after 1d collision equation
      const v1 = {x: (u1.x * (m1 - m2)) / (m1 + m2) + (u2.x * 2 * m2) / (m1 + m2), y: u1.y};
      const v2 = {x: (u2.x * (m1 - m2)) / (m1 + m2) + (u1.x * 2 * m2) / (m1 + m2), y: u2.y};

      // Final velocity after rotating axis back to original location
      const vFinal1 = this.rotate(v1, -angle);
      const vFinal2 = this.rotate(v2, -angle);

      // Swap particle velocities for realistic bounce effect
      if (!particle.markToDestroy) {
        particle.velocity.x = vFinal1.x;
        particle.velocity.y = vFinal1.y;
      }

      if (!otherParticle.markToDestroy) {
        otherParticle.velocity.x = vFinal2.x;
        otherParticle.velocity.y = vFinal2.y;
      }
    }
  }
}
