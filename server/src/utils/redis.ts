import {createClient, RedisClient} from 'redis';
// import {Config} from '../config';

export class RedisManager {
  static manager: RedisManager;
  private client?: RedisClient;

  append(key: string, value: string): Promise<void> {
    return new Promise((res, rej) => {
      this.client?.append(key, value, (err, result) => {
        if (err) {
          rej(err);
          return;
        }
        res();
      });
    });
  }

  expire(key: string, duration: number): Promise<void> {
    return new Promise((res, rej) => {
      this.client?.expire(key, duration, (err, result) => {
        if (err) {
          rej(err);
          return;
        }
        res();
      });
    });
  }

  flushAll(): Promise<void> {
    return new Promise((res, rej) => {
      this.client?.flushall((err, result) => {
        if (err) {
          rej(err);
          return;
        }
        res();
      });
    });
  }

  get<T>(key: string, def?: T): Promise<T> {
    return new Promise((res, rej) => {
      this.client?.get(key, (err, result) => {
        if (err) {
          rej(err);
          return;
        }

        res((JSON.parse(result) as T) || def);
      });
    });
  }

  getString(key: string, def?: string): Promise<string> {
    return new Promise((res, rej) => {
      this.client?.get(key, (err, result) => {
        if (err) {
          rej(err);
          return;
        }

        res(result || def);
      });
    });
  }

  incr(key: string) {
    return new Promise((res, rej) => {
      this.client?.incr(key, (err, result) => {
        if (err) {
          rej(err);
          return;
        }

        res();
      });
    });
  }

  publish<T>(key: string, value: T): Promise<void> {
    return new Promise((res, rej) => {
      this.client?.publish(key, JSON.stringify(value), (err, result) => {
        if (err) {
          rej(err);
          return;
        }
        res();
      });
    });
  }

  set<T>(key: string, value: T): Promise<void> {
    return new Promise((res, rej) => {
      this.client?.set(key, JSON.stringify(value), (err, result) => {
        if (err) {
          rej(err);
          return;
        }
        res();
      });
    });
  }

  setString(key: string, value: string): Promise<string> {
    return new Promise((res, rej) => {
      this.client?.set(key, value, (err, result) => {
        if (err) {
          rej(err);
          return;
        }
        res();
      });
    });
  }

  subscribe<T>(key: string, callback: (result: T) => void): void {
    this.client?.subscribe(key, (err, result) => {
      if (err) {
        return;
      }
      callback(JSON.parse(result));
    });
  }

  unsubscribe<T>(key: string): Promise<void> {
    return new Promise((res, rej) => {
      this.client?.unsubscribe(key, (err, result) => {
        if (err) {
          rej(err);
          return;
        }
        res();
      });
    });
  }

  static setup(): Promise<RedisManager> {
    return new Promise<RedisManager>((res, rej) => {
      if (RedisManager.manager) {
        if (RedisManager.manager.client?.connected) {
          res(RedisManager.manager);
          return;
        }
      }
      console.time('connecting redis');
      const manager = new RedisManager();
      RedisManager.manager = manager;
      /*
      manager.client = createClient({
        host: Config.redis.host,
        port: Config.redis.port,
        auth_pass: Config.redis.authPass,
      });
      manager.client.on('ready', (result) => {
        console.timeEnd('connecting redis');
        res(manager);
      });*/
    });
  }
}
