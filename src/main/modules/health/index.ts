import { Application } from 'express';
import os from 'os';
import { infoRequestHandler } from '@hmcts/info-provider';
import config from 'config';
const healthcheck = require('@hmcts/nodejs-healthcheck');

export class HealthCheck {

  public enableFor(app: Application): void {
    app.get('/info', infoRequestHandler({
      extraBuildInfo: {
        name: config.get('services.name'),
        host: os.hostname(),
        uptime: process.uptime(),
      },
      info: {},
    }));

    const healthOptions = {
      timeout: config.get('health.timeout'),
      deadline: config.get('health.deadline'),
      callback: (err : any, res : any) => {
        if (err) {
          if (res && res.body) {
            console.log('hc response: ' + JSON.stringify(res.body) + '; error: ', JSON.stringify(err));
          } else {
            console.error('hc failed, empty response', err);
          }
        }
        
        if (res && res.body) {
          return res.body.status == 'UP' ? healthcheck.up() : healthcheck.down();
        }
        return healthcheck.down();
      }
    };

    const healthCheckConfig = {
      checks: {
        'idam-web-public': healthcheck.web(`${config.get('services.idam.url.public')}/health`, healthOptions),
        'idam-api': healthcheck.web(`${config.get('services.idam.url.api')}/health`, healthOptions),
        ...(app.locals.redisClient && {
          redis: healthcheck.raw(() => (
            app.locals.redisClient.ping() ? healthcheck.up() : healthcheck.down())
          )
        })
      },
      buildInfo: {
        name: config.get('services.name'),
        host: os.hostname(),
        uptime: process.uptime(),
      },
    };

    healthcheck.addTo(app, healthCheckConfig);
  }
}
