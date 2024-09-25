import { fs } from 'memfs';
import config from 'config';
import { User } from '../../interfaces/User';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { TelemetryClient } from 'applicationinsights';
import logger from '../../modules/logging';
import { Redis } from 'ioredis';

type Store = {
  set: (reportUUID: string, data: Object[]) => Promise<void>;
  get: (reportUUID: string) => Promise<string>;
}

export class ReportsHandler {
  private readonly store: Store;
  private readonly reportTimeout = 30 * 60;

  public constructor(
    private readonly telemetryClient: TelemetryClient
  ) {
    this.store = this.getStore();
  }

  public saveReportQueryRoles(roles: string[]): Promise<string> {
    const uuid = uuidv4();
    return this.store
      .set(`${uuid}`, roles)
      .then(() => uuid)
      .catch(e => {
        logger.error(e);
        this.telemetryClient.trackTrace(e);
        throw new Error();
      });
  }

  public getReportQueryRoles(reportUUID: string): Promise<string[]> {
    return this.store.get(`${reportUUID}`)
      .then((data: string) => JSON.parse(data))
      .catch(e => {
        logger.error(e);
        this.telemetryClient.trackTrace(e);
        throw new Error();
      });
  }

  private getStore(): Store {
    const redisHost: string = config.get('session.redis.host');
    const redisPort: number = config.get('session.redis.port');
    const redisPass: string = config.get('session.redis.key');

    if (redisHost && redisPass) {
      logger.info('Using Redis Store');
      return this.getRedisStore(redisHost, redisPort, redisPass);
    }

    logger.info('Using In Memory Store');
    return this.getInMemoryStore();
  }

  private getRedisStore(redisHost: string, redisPort: number, redisPass: string): Store {
    const client = new Redis({ port: redisPort ?? 6380, host: redisHost, password: redisPass, tls: {} });

    const setAsync = promisify(client.set).bind(client);
    const getAsync = promisify(client.get).bind(client);

    return {
      set: async (reportUUID: string, users: User[]): Promise<void> => {
        return setAsync(reportUUID, JSON.stringify(users), 'EX', this.reportTimeout)
          .catch((e: string) => {
            throw new Error('Error saving report ' + reportUUID + ' from redis store - ' + e);
          });
      },
      get: async (reportUUID: string): Promise<string> => {
        return getAsync(reportUUID)
          .catch((e: string) => {
            throw new Error('Error saving report ' + reportUUID + ' from redis store - ' + e);
          });
      }
    };
  }

  private getInMemoryStore(): Store {
    return {
      set: (reportUUID: string, users: User[]): Promise<void> => {
        return fs.promises.writeFile('/' + reportUUID, JSON.stringify(users))
          .catch(e => {
            throw new Error('Error saving report ' + reportUUID + ' from in-memory store - ' + e);
          });
      },
      get: (reportUUID: string): Promise<string> => {
        return fs.promises.readFile('/' + reportUUID)
          .then(data => data.toString())
          .catch(e => {
            throw new Error('Error getting report ' + reportUUID + ' from in-memory store - ' + e);
          });
      }
    };
  }
}
