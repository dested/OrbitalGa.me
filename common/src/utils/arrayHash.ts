export class ArrayHash<T> {
  get length() {
    return this.array.length;
  }
  array: T[] = [];
  hash: {[key: number]: T} = {};
  constructor(private primaryKey: keyof T) {}
  getIndex(index: number) {
    return this.array[index];
  }

  filter(callback: (e: T) => boolean) {
    return this.array.filter(callback);
  }

  map<T2>(callback: (e: T) => T2) {
    return this.array.map(callback);
  }

  lookup<TLookup extends T>(key: number): TLookup {
    return this.hash[key] as TLookup;
  }

  remove(item: T) {
    delete this.hash[(item[this.primaryKey] as unknown) as number];
    this.array.splice(this.array.indexOf(item), 1);
  }

  push(item: T) {
    this.array.push(item);
    this.hash[(item[this.primaryKey] as unknown) as number] = item;
  }
}
