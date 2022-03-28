import * as express from 'express';
import helmet from 'helmet';

export interface HelmetConfig {
  referrerPolicy: string;
}

const self = "'self'";

/**
 * Module that enables helmet in the application
 */
export class Helmet {
  constructor(public config: HelmetConfig) {}

  public enableFor(app: express.Express): void {
    // include default helmet functions
    app.use(helmet());

    this.setContentSecurityPolicy(app);
    this.setReferrerPolicy(app, this.config.referrerPolicy);
  }

  private setContentSecurityPolicy(app: express.Express): void {
    const scriptSrc = [self];

    if (app.locals.ENV === 'development') {
      scriptSrc.push("'unsafe-inline'");
      scriptSrc.push("'unsafe-eval'");
    }

    app.use(
      helmet.contentSecurityPolicy({
        useDefaults: false,
        directives: {
          connectSrc: [self],
          defaultSrc: ["'none'"],
          fontSrc: [self, 'data:'],
          imgSrc: [self],
          objectSrc: [self],
          scriptSrc: scriptSrc,
          styleSrc: [self]
        }
      })
    );
  }

  private setReferrerPolicy(app: express.Express, policy: string): void {
    if (!policy) {
      throw new Error('Referrer policy configuration is required');
    }

    app.use(helmet.referrerPolicy({ policy }));
  }
}
