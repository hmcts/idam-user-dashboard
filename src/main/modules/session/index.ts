import { Application } from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import FileStoreFactory from 'session-file-store';
import { Redis } from 'ioredis';
import config from 'config';

export class AppSession {
  private readonly sessionSecret: string = config.get('session.secret');
  private readonly cookieName: string = config.get('session.appCookie.name');

  public enableFor(app: Application): void {
    const store = this.createSessionStore(app);

    app.use(
      session({
        name: this.cookieName,
        secret: this.sessionSecret,
        resave: false,
        saveUninitialized: false,
        rolling: true,
        store,
        cookie: {
          httpOnly: true,
          sameSite: 'lax'
        },
      })
    );
  }

  private createSessionStore(app: Application) {
    const redisHost: string | undefined = config.get('session.redis.host');
    const redisPort: number | undefined = config.get('session.redis.port');
    const redisPass: string | undefined = config.get('session.redis.key');

    if (redisHost && redisPass) {
      const client = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPass,
        tls: {},
      });

      app.locals.appRedisClient = client;

      return new RedisStore({
        client,
        prefix: 'idam_hmcts_access:',
      });
    }
    
    const FileStore = FileStoreFactory(session);
    return new FileStore({ path: '/tmp' });
  }
}