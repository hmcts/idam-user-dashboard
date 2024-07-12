import config from 'config';
import * as propertiesVolume from '@hmcts/properties-volume';
import { Application } from 'express';
import { get, set } from 'lodash';
import { execSync } from 'child_process';

export class PropertiesVolume {

  enableFor(app: Application): void {
    console.log('env is ' + app.locals.ENV);
    if (app.locals.ENV !== 'development') {
      propertiesVolume.addTo(config);
      this.setSecret('secrets.idam-idam.AppInsightsConnectionString', 'appInsights.connectionString');
      this.setSecret('secrets.idam-idam.launchdarkly-sdk-key', 'featureFlags.launchdarkly.sdkKey');
      this.setSecret('secrets.idam-idam.idam-user-dashboard-client-secret', 'services.idam.clientSecret');
      this.setSecret('secrets.idam-idam.idam-user-dashboard-systemUser-username', 'services.idam.systemUser.username');
      this.setSecret('secrets.idam-idam.idam-user-dashboard-systemUser-password', 'services.idam.systemUser.password');
      this.setSecret('secrets.idam-idam.redis-hostname', 'session.redis.host');
      this.setSecret('secrets.idam-idam.redis-port', 'session.redis.port');
      this.setSecret('secrets.idam-idam.redis-key', 'session.redis.key');

      // Use idam-preview redis if using idam-idam-preview kv
      if(config.has('secrets.idam-idam-preview')) {
        console.log('Using idam-preview redis');
        this.setSecret('secrets.idam-idam-preview.redis-hostname', 'session.redis.host');
        this.setSecret('secrets.idam-idam-preview.redis-port', 'session.redis.port');
        this.setSecret('secrets.idam-idam-preview.redis-key', 'session.redis.key');
      }

      this.setSecret('session.redis.key', 'session.secret');
    } else {
      this.setLocalSecret('AppInsightsConnectionString', 'appInsights.connectionString');
      this.setLocalSecret('launchdarkly-sdk-key', 'featureFlags.launchdarkly.sdkKey');
      this.setLocalSecret('idam-user-dashboard-client-secret', 'services.idam.clientSecret');
      this.setLocalSecret('idam-user-dashboard-systemUser-username', 'services.idam.systemUser.username');
      this.setLocalSecret('idam-user-dashboard-systemUser-password', 'services.idam.systemUser.password');
    }
  }

  private setSecret(fromPath: string, toPath: string): void {
    if (config.has(fromPath)) {
      set(config, toPath, get(config, fromPath));
    }
  }

  private setLocalSecret(secret: string, toPath: string): void {
    // Load a secret from the AAT vault using azure cli
    const result = execSync('az keyvault secret show --vault-name idam-idam-aat -o tsv --query value --name ' + secret);
    set(config, toPath, result.toString().replace('\n', ''));
  }
}
