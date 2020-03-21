export class AnimationUtils {
  static animations: AnimationInstance[] = [];

  static stopAnimations() {
    for (const animation of AnimationUtils.animations) {
      animation.stop = true;
    }
    AnimationUtils.animations.length = 0;
  }

  static lerp(start: number, end: number, amt: number): number {
    return start + (end - start) * amt;
  }

  static start(options: {
    start: number;
    finish: number;
    callback: (current: number) => void;
    duration: number;
    easing: (percent: number) => number;
    complete?: (finish: number) => void;
  }): void {
    if (options.start === options.finish) {
      options.callback(options.finish);
      options.complete && options.complete(options.finish);
      return;
    }

    const startTime = +new Date();
    const animationInstance = new AnimationInstance();
    AnimationUtils.animations.push(animationInstance);

    function next() {
      if (animationInstance.stop) {
        options.callback(options.finish);
        options.complete && options.complete(options.finish);
        return;
      }
      if (animationInstance.cancel) {
        return;
      }
      const curTime = +new Date();
      const percent = Math.max(Math.min((curTime - startTime) / options.duration, 1), 0);
      const j = options.easing(percent);
      options.callback(options.start + (options.finish - options.start) * j);
      if (percent >= 1) {
        AnimationUtils.animations.splice(AnimationUtils.animations.indexOf(animationInstance), 1);
        options.complete && options.complete(options.finish);
      } else {
        requestAnimationFrame(next);
      }
    }

    requestAnimationFrame(next);
  }

  static lightenDarkenColor(col: string, amount: number) {
    let usePound = false;
    if (col[0] === '#') {
      col = col.slice(1);
      usePound = true;
    }
    const num = (parseInt as any)(col, 16);
    let r = (num >> 16) + amount;

    if (r > 255) {
      r = 255;
    } else if (r < 0) {
      r = 0;
    }

    let b = ((num >> 8) & 0x00ff) + amount;

    if (b > 255) {
      b = 255;
    } else if (b < 0) {
      b = 0;
    }

    let g = (num & 0x0000ff) + amount;

    if (g > 255) {
      g = 255;
    } else if (g < 0) {
      g = 0;
    }

    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16);
  }

  static easings = {
    // no easing, no acceleration
    linear(t: number): number {
      return t;
    },
    // accelerating from zero velocity
    easeInQuad(t: number): number {
      return t * t;
    },
    // decelerating to zero velocity
    easeOutQuad(t: number): number {
      return t * (2 - t);
    },
    // acceleration until halfway, then deceleration
    easeInOutQuad(t: number): number {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    // accelerating from zero velocity
    easeInCubic(t: number): number {
      return t * t * t;
    },
    // decelerating to zero velocity
    easeOutCubic(t: number): number {
      return --t * t * t + 1;
    },
    // acceleration until halfway, then deceleration
    easeInOutCubic(t: number): number {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },
    // accelerating from zero velocity
    easeInQuart(t: number): number {
      return t * t * t * t;
    },
    // decelerating to zero velocity
    easeOutQuart(t: number): number {
      return 1 - --t * t * t * t;
    },
    // acceleration until halfway, then deceleration
    easeInOutQuart(t: number): number {
      return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
    },
    // accelerating from zero velocity
    easeInQuint(t: number): number {
      return t * t * t * t * t;
    },
    // decelerating to zero velocity
    easeOutQuint(t: number): number {
      return 1 + --t * t * t * t * t;
    },
    // acceleration until halfway, then deceleration
    easeInOutQuint(t: number): number {
      return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
    },
  };
}

export class AnimationInstance {
  stop: boolean = false;
  cancel: boolean = false;
}
