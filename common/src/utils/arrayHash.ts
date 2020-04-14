export class ArrayHash<T> {
  array: T[] = [];
  hash: {[key: number]: T} = {};
  constructor(private primaryKey: keyof T) {}
  get length() {
    return this.array.length;
  }

  filter(callback: (e: T) => boolean) {
    return this.array.filter(callback);
  }
  getIndex(index: number) {
    return this.array[index];
  }

  lookup<TLookup extends T>(key: number): TLookup | undefined {
    return this.hash[key] as TLookup;
  }

  map<T2>(callback: (e: T) => T2) {
    return this.array.map(callback);
  }

  push(item: T) {
    this.array.push(item);
    if (this.hash[(item[this.primaryKey] as unknown) as number]) {
      throw new Error('Array hash primary key must be unique');
    }
    this.hash[(item[this.primaryKey] as unknown) as number] = item;
  }

  remove(item: T) {
    delete this.hash[(item[this.primaryKey] as unknown) as number];
    if (this.array.indexOf(item) === -1) {
      throw new Error('Array hash primary key must be unique');
    }
    this.array.splice(this.array.indexOf(item), 1);
  }
}
