import config from 'config';
import logger from '../../modules/logging';
import { ExpiringStore } from './ExpiringStore';
import { InMemoryExpiringStore } from './InMemoryExpiringStore';
import { RedisExpiringStore } from './RedisExpiringStore';

export class ExpiringStoreFactory {
  public static create(): ExpiringStore {
    const redisHost: string = config.get('session.redis.host');
    const redisPort: string | number = config.get('session.redis.port');
    const redisPass: string = config.get('session.redis.key');

    if (redisHost && redisPass) {
      logger.info('Using Redis Expiring Store');
      return new RedisExpiringStore(redisHost, redisPort, redisPass);
    }

    logger.info('Using In Memory Expiring Store');
    return new InMemoryExpiringStore();
  }
}
