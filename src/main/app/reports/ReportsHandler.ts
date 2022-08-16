import { fs } from 'memfs';
import config from 'config';
import { createClient } from 'redis';
import { User } from '../../interfaces/User';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { Parser } from 'json2csv';

type Store = {
  set: (reportUUID: string, users: User[]) => Promise<void>;
  get: (reportUUID: string) => Promise<string>;
}

export class ReportsHandler {
  private readonly store: Store;
  private readonly reportTimeout = 30 * 60 * 1000;

  public constructor() {
    this.store = this.getStore();
  }

  public saveReport(users: User[]): Promise<string> {
    const uuid = uuidv4();
    return this.store
      .set(uuid, users)
      .then(() => uuid);
  }

  public getReport(reportUUID: string): Promise<string> {
    return this.store.get(reportUUID)
      .then((data: string) => JSON.parse(data))
      .then((data: Record<string, string>) => new Parser().parse(data));
  }

  private getStore(): Store {
    const redisHost: string = config.get('session.redis.host');
    const redisPort: number = config.get('session.redis.port');
    const redisPass: string = config.get('session.redis.key');

    if (redisHost && redisPass) {
      console.log('Using Redis Store');
      return this.getRedisStore(redisHost, redisPort, redisPass);
    }

    console.log('Using In Memory Store');
    return this.getInMemoryStore();
  }

  private getRedisStore(redisHost: string, redisPort: number, redisPass: string): Store {
    const client = createClient({
      host: redisHost,
      password: redisPass,
      port: redisPort ?? 6380,
      tls: true
    });

    const setAsync = promisify(client.set).bind(client);
    const expireAsync = promisify(client.expire).bind(client);
    const getAsync = promisify(client.get).bind(client);

    return {
      set: async (reportUUID: string, users: User[]): Promise<void> => {
        await setAsync(reportUUID, JSON.stringify(users));
        await expireAsync(reportUUID, this.reportTimeout);
      },
      get: async (reportUUID: string): Promise<string> => {
        return getAsync(reportUUID);
      }
    };
  }

  private getInMemoryStore(): Store {
    return {
      set: (reportUUID: string, users: User[]): Promise<void> => {
        return fs.promises.writeFile('/' + reportUUID, JSON.stringify(users));
      },
      get: (reportUUID: string): Promise<string> => {
        return fs.promises.readFile('/' + reportUUID)
          .then(data => data.toString());
      }
    };
  }
}
