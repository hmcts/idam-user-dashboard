export interface ExpiringStore {
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  get<T>(key: string): Promise<T | undefined>;
  delete(key: string): Promise<void>;
}
