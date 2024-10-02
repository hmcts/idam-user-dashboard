import * as express from 'express';
import helmet from 'helmet';

type ReferrerPolicyToken = "no-referrer" | "no-referrer-when-downgrade" | "same-origin" | "origin" | "strict-origin" | "origin-when-cross-origin" | "strict-origin-when-cross-origin" | "unsafe-url" | ""

export interface HelmetConfig {
  referrerPolicy: ReferrerPolicyToken;
}

const self = "'self'";
const view_report_script_1 = "'sha256-jVI3dCx2J6gL6bzR1ljQZftjkTtjif8MLnKuMb2CK4w='";
const view_report_script_2 = "'sha256-8x0U8ucWIxYD4ShTA5KJD1fGCerO0FA90OiUpT5Y5b0='";
const hide_roles_script = "'sha256-SfXgDY4MDjT3BXLxJMT9BDqgwH3Zr/v1rQfl9YPKZbA='";
const govuk_script_1 = "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='";
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
    const scriptSrc = [self, view_report_script_1, view_report_script_2, hide_roles_script, govuk_script_1];

    if (app.locals.ENV === 'development') {
      scriptSrc.push("'unsafe-inline'");
      scriptSrc.push("'unsafe-eval'");
    }

    app.use(
      helmet.contentSecurityPolicy({
        useDefaults: false,
        directives: {
          connectSrc: [self],
          defaultSrc: [self],
          fontSrc: [self, 'data:'],
          imgSrc: [self],
          objectSrc: [self],
          scriptSrc: scriptSrc,
          styleSrc: [self]
        }
      })
    );
  }

  private setReferrerPolicy(app: express.Express, policy: ReferrerPolicyToken): void {
    if (!policy) {
      throw new Error('Referrer policy configuration is required');
    }

    app.use(helmet.referrerPolicy({ policy }));
  }
}
