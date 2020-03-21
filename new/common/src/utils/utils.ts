export class Utils {
  static toDictionary<T>(items: T[], getKey: (t: T) => string): {[key: string]: T} {
    const dictionary: {[key: string]: T} = {};
    for (const item of items) {
      dictionary[getKey(item)] = item;
    }
    return dictionary;
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

  static arrayToDictionary<T>(array: T[], callback: (t: T) => string | number): {[key: string]: T} {
    return array.reduce((a, b) => {
      a[callback(b)] = b;
      return a;
    }, {} as any);
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

  static flattenArray<T>(arrays: T[][]): T[] {
    return Array.prototype.concat.apply([], arrays);
  }

  static sum<T>(array: T[], callback: (t: T) => number): number {
    return array.reduce((a, b) => a + callback(b), 0);
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

  static timeout(timeout: number): Promise<void> {
    return new Promise(res => {
      setTimeout(() => {
        res();
      }, timeout);
    });
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
      maps[group] = groups[group].map(a => resultCallback(a));
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

  static mapMany<T, T2>(array: T[], callback: (a: T) => T2[]): T2[] {
    const result: T2[] = [];
    for (const winningVote of array) {
      result.push(...callback(winningVote));
    }
    return result;
  }

  static randomElement<T>(array: T[]) {
    const n = Math.floor(Math.random() * (array.length - 1));
    return array[n];
  }

  static range(start: number, finish: number) {
    const r: number[] = [];
    for (let i = start; i < finish; i++) {
      r.push(i);
    }
    return r;
  }

  static checksum(a: Uint8Array): number {
    const len = a.length;
    let fnv = 0;
    for (let i = 0; i < len; i++) {
      fnv = (fnv + (((fnv << 1) + (fnv << 4) + (fnv << 7) + (fnv << 8) + (fnv << 24)) >>> 0)) ^ (a[i] & 0xff);
    }
    return fnv >>> 0;
  }

  static roundUpTo8(value: number) {
    return value + (8 - (value % 8));
  }
}
