// this is from lance.gg. they are better at this than I am

const SIXTY_PER_SEC = 1000 / 60;
const LOOP_SLOW_THRESH = 0.3;
const LOOP_SLOW_COUNT = 10;

type SchedulerOptions = {
  // number number of milliseconds to add when delaying or hurrying the execution
  delay: number;
  // number of milliseconds between each invocation, not including the function's execution time
  period: number;
  tick: () => void;
};

export class Scheduler {
  private delayCounter = 0;
  private nextExecTime = 0;
  private options: SchedulerOptions;
  private requestedDelay = 0;
  private stopped: boolean = false;

  constructor(options: Partial<SchedulerOptions>) {
    this.options = {period: SIXTY_PER_SEC, delay: SIXTY_PER_SEC / 3, tick: () => {}, ...options};
  }

  callTick() {
    if (this.delayCounter >= LOOP_SLOW_COUNT) {
      this.delayCounter = 0;
    }
    this.options.tick();
  }

  delayTick() {
    this.requestedDelay += this.options.delay;
  }

  hurryTick() {
    this.requestedDelay -= this.options.delay;
  }

  nextTick = () => {
    if (this.stopped) return;
    const stepStartTime = new Date().getTime();
    if (stepStartTime > this.nextExecTime + this.options.period * LOOP_SLOW_THRESH) {
      this.delayCounter++;
    } else this.delayCounter = 0;

    this.callTick();
    this.nextExecTime = stepStartTime + this.options.period + this.requestedDelay;
    this.requestedDelay = 0;
    setTimeout(this.nextTick, this.nextExecTime - new Date().getTime());
  };

  // in same cases, setTimeout is ignored by the browser,
  // this is known to happen during the first 100ms of a touch event
  // on android chrome.  Double-check the game loop using requestAnimationFrame
  nextTickChecker = () => {
    if (this.stopped) return;
    const currentTime = new Date().getTime();
    if (currentTime > this.nextExecTime) {
      this.delayCounter++;
      this.callTick();
      this.nextExecTime = currentTime + this.options.period;
    }
    window.requestAnimationFrame(this.nextTickChecker);
  };

  /**
   * start the schedule
   * @return {Scheduler} returns this scheduler instance
   */
  start() {
    setTimeout(this.nextTick);
    if (typeof window === 'object' && typeof window.requestAnimationFrame === 'function')
      window.requestAnimationFrame(this.nextTickChecker);
    return this;
  }

  stop() {
    this.stopped = true;
  }
}
