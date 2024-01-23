import * as express from 'express';
import helmet from 'helmet';

export interface HelmetConfig {
  referrerPolicy: string;
}

const self = "'self'";
const view_report_script_1 = "'sha256-jVI3dCx2J6gL6bzR1ljQZftjkTtjif8MLnKuMb2CK4w='";
const view_report_script_2 = "'sha256-8x0U8ucWIxYD4ShTA5KJD1fGCerO0FA90OiUpT5Y5b0='";
const hide_roles_script = "'sha256-SfXgDY4MDjT3BXLxJMT9BDqgwH3Zr/v1rQfl9YPKZbA='";
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
    const scriptSrc = [self, view_report_script_1, view_report_script_2, hide_roles_script];

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
