import config from 'config';
import * as propertiesVolume from '@hmcts/properties-volume';
import { Application } from 'express';
import { get, set } from 'lodash';
import { execSync } from 'child_process';

export class PropertiesVolume {

  enableFor(app: Application): void {
    if (app.locals.ENV !== 'development') {
      propertiesVolume.addTo(config);
      this.setSecret('secrets.idam-idam.AppInsightsInstrumentationKey', 'appInsights.instrumentationKey');
      this.setSecret('secrets.idam-idam.launchdarkly-sdk-key', 'featureFlags.launchdarkly.sdkKey');
      this.setSecret('secrets.idam-idam.idam-user-dashboard-client-secret', 'services.idam.clientSecret');
      this.setSecret('secrets.idam-idam.redis-hostname', 'session.redis.host');
      this.setSecret('secrets.idam-idam.redis-port', 'session.redis.port');
      this.setSecret('secrets.idam-idam.redis-key', 'session.redis.key');
      this.setSecret('secrets.idam-idam.redis-key', 'session.secret');

      console.log('TEST_VAR:' + config.get('testVar'));
      console.log('REDIS SESSION HOST:' + config.get('session.redis.host'));
      console.log('REDIS SESSION PORT:' + config.get('session.redis.port'));

    } else {
      this.setLocalSecret('AppInsightsInstrumentationKey', 'appInsights.instrumentationKey');
      this.setLocalSecret('launchdarkly-sdk-key', 'featureFlags.launchdarkly.sdkKey');
      this.setLocalSecret('idam-user-dashboard-client-secret', 'services.idam.clientSecret');
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
