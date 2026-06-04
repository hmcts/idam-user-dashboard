import { Redis } from 'ioredis';
import { ExpiringStore } from './ExpiringStore';

export class RedisExpiringStore implements ExpiringStore {
  private readonly client: Redis;

  public constructor(redisHost: string, redisPort: string | number, redisPass: string) {
    this.client = new Redis({
      port: Number(redisPort ?? 6380),
      host: redisHost,
      password: redisPass,
      tls: {}
    });
  }

  public async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  public async get<T>(key: string): Promise<T | undefined> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) as T : undefined;
  }

  public async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}
