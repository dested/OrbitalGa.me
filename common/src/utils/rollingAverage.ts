import {Utils} from './utils';

export class RollingAverage {
  items: number[] = [];
  constructor(private roll: number = 10) {}
  get average() {
    return Utils.sum(this.items, (a) => a) / this.items.length;
  }
  push(n: number) {
    this.items.push(n);
    this.items = this.items.slice(-this.roll);
  }
}
