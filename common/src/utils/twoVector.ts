import {SDSimpleObject} from '../schemaDefiner/schemaDefinerTypes';

export class TwoVector {
  constructor(public x: number, public y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * Add other vector to this vector
   *
   * @param {TwoVector} other the other vector
   * @return {TwoVector} returns self
   */
  add(other: TwoVectorModel) {
    this.x += other.x;
    this.y += other.y;

    return this;
  }

  /**
   * Create a clone of this vector
   *
   * @return {TwoVector} returns clone
   */
  clone() {
    return new TwoVector(this.x, this.y);
  }

  /**
   * Copy values from another TwoVector into this TwoVector
   *
   * @param {TwoVector} sourceObj the other vector
   * @return {TwoVector} returns self
   */
  copy(sourceObj: TwoVectorModel) {
    this.x = sourceObj.x;
    this.y = sourceObj.y;

    return this;
  }

  /**
   * Get vector length
   *
   * @return {Number} length of this vector
   */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Apply in-place lerp (linear interpolation) to this TwoVector
   * towards another TwoVector
   * @param {TwoVector} target the target vector
   * @param {Number} p The percentage to interpolate
   * @return {TwoVector} returns self
   */
  lerp(target: TwoVector, p: number) {
    this.x += (target.x - this.x) * p;
    this.y += (target.y - this.y) * p;

    return this;
  }
  model(): TwoVectorModel {
    return {x: this.x, y: this.y};
  }

  multiply(other: TwoVector) {
    this.x *= other.x;
    this.y *= other.y;

    return this;
  }

  /**
   * Multiply this TwoVector by a scalar
   *
   * @param {Number} s the scale
   * @return {TwoVector} returns self
   */
  multiplyScalar(s: number) {
    this.x *= s;
    this.y *= s;

    return this;
  }

  /**
   * Normalize this vector, in-place
   *
   * @return {TwoVector} returns self
   */
  normalize() {
    this.multiplyScalar(1 / this.length());
    return this;
  }

  serialize(): TwoVectorModel {
    return {
      x: this.x,
      y: this.y,
    };
  }

  /**
   * Set TwoVector values
   *
   * @param {Number} x x-value
   * @param {Number} y y-value
   * @return {TwoVector} returns self
   */
  set(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * Subtract other vector to this vector
   *
   * @param {TwoVector} other the other vector
   * @return {TwoVector} returns self
   */
  subtract(other: TwoVectorModel) {
    this.x -= other.x;
    this.y -= other.y;

    return this;
  }

  toString() {
    return `[${this.x.toFixed(3)},${this.y.toFixed(3)}]`;
  }
  static fromModel(model: TwoVectorModel): TwoVector {
    return new TwoVector(model.x, model.y);
  }

  /**
   * Get bending Delta Vector
   * towards another TwoVector
   * @param {TwoVectorModel} original TwoVector
   * @param {TwoVector} target the target vector
   * @param {Object} options bending options
   * @param {Number} options.increments number of increments
   * @param {Number} options.percent The percentage to bend
   * @param {Number} options.min No less than this value
   * @param {Number} options.max No more than this value
   * @return {TwoVector} returns new Incremental Vector
   */
  static getBendingDelta(
    original: TwoVectorModel,
    target: TwoVector,
    options: {increments: number; max?: number; min?: number; percent: number}
  ) {
    const increment = target.clone();
    increment.subtract(original);
    increment.multiplyScalar(options.percent);

    // check for max case
    if (
      (typeof options.max === 'number' && increment.length() > options.max) ||
      (typeof options.min === 'number' && increment.length() < options.min)
    ) {
      return new TwoVector(0, 0);
    }

    // divide into increments
    increment.multiplyScalar(1 / options.increments);

    return increment;
  }
}

export type TwoVectorModel = {
  x: number;
  y: number;
};

export const TwoVectorSchema: SDSimpleObject<TwoVectorModel> = {
  x: 'float32',
  y: 'float32',
};
