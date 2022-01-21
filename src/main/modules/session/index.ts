import { Application } from 'express';
import session from 'express-session';
import ConnectRedis from 'connect-redis';
import { createClient } from 'redis';
import config from 'config';
import FileStoreFactory from 'session-file-store';

const RedisStore = ConnectRedis(session);
const FileStore = FileStoreFactory(session);
const cookieMaxAge = 21 * (60 * 1000); // 21 minutes

export class SessionStorage {
  public enableFor(app: Application): void {
    app.use(session({
      name: 'idam-user-dashboard-session',
      resave: false,
      saveUninitialized: false,
      secret: config.get('session.secret'),
      cookie: {
        httpOnly: true,
        maxAge: cookieMaxAge,
      },
      rolling: true, // Renew the cookie for another 20 minutes on each request
      store: this.getStore(app),
    }));
  }

  private getStore(app: Application): session.Store {
    const redisHost: string = config.get('session.redis.host');
    const redisPort: number = config.get('session.redis.port');
    const redisPass: string = config.get('session.redis.key');

    if (redisHost && redisPass) {
      const client = createClient({
        host: redisHost,
        password: redisPass,
        port: redisPort ?? 6380,
        tls: true
      });

      app.locals.redisClient = client;
      return new RedisStore({ client });
    }

    return new FileStore({ path: '/tmp' });
  }
}
