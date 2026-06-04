import { ExpiringStore } from './ExpiringStore';

type StoredValue = {
  value: string;
  expiresAt: number;
};

export class InMemoryExpiringStore implements ExpiringStore {
  private readonly values = new Map<string, StoredValue>();

  public async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.values.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  public async get<T>(key: string): Promise<T | undefined> {
    const storedValue = this.values.get(key);
    if (!storedValue) {
      return undefined;
    }

    if (Date.now() > storedValue.expiresAt) {
      this.values.delete(key);
      return undefined;
    }

    return JSON.parse(storedValue.value) as T;
  }

  public async delete(key: string): Promise<void> {
    this.values.delete(key);
  }
}
