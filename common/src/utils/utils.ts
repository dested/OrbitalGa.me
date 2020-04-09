export class Utils {
  static arrayToDictionary<T>(array: T[], callback: (t: T) => string | number): {[key: string]: T} {
    return array.reduce((a, b) => {
      a[callback(b)] = b;
      return a;
    }, {} as any);
  }

  static bitsToInt(...bools: boolean[]) {
    return parseInt('1' + bools.map((a) => (a ? '1' : '0')).join(''), 2);
  }
  static byteDegToRad(deg: number) {
    return deg * (360 / 255) * 0.0174533;
  }

  static checksum(a: Uint8Array): number {
    const len = a.length;
    let fnv = 0;
    for (let i = 0; i < len; i++) {
      fnv = (fnv + (((fnv << 1) + (fnv << 4) + (fnv << 7) + (fnv << 8) + (fnv << 24)) >>> 0)) ^ (a[i] & 0xff);
    }
    return fnv >>> 0;
  }

  static degToRad(deg: number) {
    return deg * 0.0174533;
  }

  static flattenArray<T>(arrays: T[][]): T[] {
    return Array.prototype.concat.apply([], arrays);
  }

  static flipCoin<T, T2>(heads: T, tails: T2) {
    return Math.random() < 0.5 ? heads : tails;
  }

  static formatBytes(bytes: number, decimals: number = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static groupBy<T, TKey extends string>(array: T[], callback: (t: T) => TKey): {[key in TKey]: T[]} {
    const groups: {[key in TKey]: T[]} = {} as any;
    for (const item of array) {
      const result = callback(item);
      if (!groups[result]) {
        groups[result] = [];
      }
      groups[result].push(item);
    }
    return groups;
  }

  static groupByMap<T, TKey extends string, TResult>(
    array: T[],
    callback: (t: T) => TKey,
    resultCallback: (t: T) => TResult
  ): {[key in TKey]: TResult[]} {
    const groups: {[key in TKey]: T[]} = {} as any;
    for (const item of array) {
      const result = callback(item);
      if (!groups[result]) {
        groups[result] = [];
      }
      groups[result].push(item);
    }
    const maps: {[key in TKey]: TResult[]} = {} as any;

    for (const group in groups) {
      maps[group] = groups[group].map((a) => resultCallback(a));
    }

    return maps;
  }

  static groupByReduce<T, TKey extends string, TResult>(
    array: T[],
    callback: (t: T) => TKey,
    resultCallback: (t: T[]) => TResult
  ): {[key in TKey]: TResult} {
    const groups: {[key in TKey]: T[]} = {} as any;
    for (const item of array) {
      const result = callback(item);
      if (!groups[result]) {
        groups[result] = [];
      }
      groups[result].push(item);
    }
    const maps: {[key in TKey]: TResult} = {} as any;

    for (const group in groups) {
      maps[group] = resultCallback(groups[group]);
    }

    return maps;
  }
  static intToBits(int: number): boolean[] {
    return int
      .toString(2)
      .split('')
      .map((a) => a === '1')
      .slice(1);
  }
  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
  }

  static lerp(v0: number, v1: number, t: number) {
    return v0 * (1 - t) + v1 * t;
  }

  static mapMany<T, T2>(array: T[], callback: (a: T) => T2[]): T2[] {
    const result: T2[] = [];
    for (const winningVote of array) {
      result.push(...callback(winningVote));
    }
    return result;
  }

  static mapObjToArray<TKey extends string, TBefore, TAfter>(
    obj: {[key in TKey]: TBefore},
    callback: (t: TKey, b: TBefore) => TAfter
  ): TAfter[] {
    const result: TAfter[] = [];
    for (const key in obj) {
      result.push(callback(key, obj[key]));
    }
    return result;
  }

  static mapObjToObj<TKey extends string, TBefore, TAfter>(
    obj: {[key in TKey]: TBefore},
    callback: (t: TKey, b: TBefore) => TAfter
  ): {[key in TKey]: TAfter} {
    const result: {[key in TKey]: TAfter} = {} as any;

    for (const key in obj) {
      result[key] = callback(key, obj[key]);
    }
    return result;
  }

  static mapToObj<TKey extends string, TResult>(
    array: TKey[],
    callback: (t: TKey) => TResult
  ): {[key in TKey]: TResult} {
    return array.reduce((a, b) => {
      a[b] = callback(b);
      return a;
    }, {} as any);
  }

  static mathSign(f: number) {
    if (f < 0) {
      return -1;
    } else if (f > 0) {
      return 1;
    }
    return 0;
  }

  static random(chance: number) {
    return Math.random() * 100 < chance;
  }

  static randomElement<T>(array: T[]) {
    const n = Math.floor(Math.random() * array.length);
    return array[n];
  }

  static randomInRange(x0: number, x1: number) {
    return (x1 - x0) * Math.random() + x0;
  }

  static range(start: number, finish: number) {
    const r: number[] = [];
    for (let i = start; i < finish; i++) {
      r.push(i);
    }
    return r;
  }

  static roundUpTo8(value: number) {
    return value + (8 - (value % 8));
  }

  static safeKeys<T>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
  }

  static sort<T>(array: T[], callback: (t: T) => number): T[] {
    const sorted = [...array];
    sorted.sort((a, b) => callback(a) - callback(b));
    return sorted;
  }

  static sortDesc<T>(array: T[], callback: (t: T) => number): T[] {
    const sorted = [...array];
    sorted.sort((a, b) => callback(b) - callback(a));
    return sorted;
  }

  static sum<T>(array: T[], callback: (t: T) => number): number {
    return array.reduce((a, b) => a + callback(b), 0);
  }

  static switchNumber<TNumber extends number, TResult>(n: TNumber, options: {[key in TNumber]: TResult}): TResult {
    if (options[n] === undefined) {
      throw new Error(`'Type not found', ${n}, ${JSON.stringify(options)}`);
    }
    return options[n];
  }
  static switchType<TType extends string | number, TResult>(n: TType, options: {[key in TType]: TResult}): TResult {
    if (options[n] === undefined) {
      throw new Error(`'Type not found', ${n}, ${JSON.stringify(options)}`);
    }
    return options[n];
  }

  static timeout(timeout: number): Promise<void> {
    return new Promise((res) => {
      setTimeout(() => {
        res();
      }, timeout);
    });
  }

  static toDictionary<T>(items: T[], getKey: (t: T) => number): {[key: number]: T} {
    const dictionary: {[key: number]: T} = {};
    for (const item of items) {
      dictionary[getKey(item)] = item;
    }
    return dictionary;
  }
}

export function objectSafeKeys<T>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

export function assert(assertion: boolean): asserts assertion {}
export function assertType<T>(assertion: any): asserts assertion is T {}
