import config from 'config';
import { execSync } from 'child_process';
import * as fs from 'fs';
import { get, merge, set } from 'lodash';
import * as path from 'path';

export class PropertiesVolume {
  private readonly mountPoint = '/mnt/secrets';

  enableFor(env: string): void {
    console.log('env is ' + env);
    if (env !== 'development') {
      this.addMountedSecretsToConfig();
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

  private addMountedSecretsToConfig(): void {
    try {
      const properties = this.readVaults(this.mountPoint);
      const prefix = path.basename(this.mountPoint);

      set(config, prefix, merge(get(config, prefix) || {}, properties));
    } catch (error) {
      const localError = error as NodeJS.ErrnoException;

      if (localError.code === 'ENOENT') {
        console.log("Could not find properties to load, check your config, you can ignore this if you don't expect any");
      } else {
        console.log(`Could not read properties from volume: '${this.mountPoint}' due to '${error}'`);
      }
    }
  }

  private setSecret(fromPath: string, toPath: string): void {
    if (config.has(fromPath)) {
      set(config, toPath, get(config, fromPath));
    }
  }

  private readVaults(mountPoint: string): Record<string, Record<string, string>> {
    return fs.readdirSync(mountPoint).reduce((vaults, vaultName) => {
      const vaultPath = path.join(mountPoint, vaultName);

      if (!fs.statSync(vaultPath).isDirectory()) {
        return vaults;
      }

      vaults[vaultName] = fs.readdirSync(vaultPath).reduce((entries, secretName) => {
        const secretPath = path.join(vaultPath, secretName);

        if (!fs.statSync(secretPath).isDirectory()) {
          entries[secretName] = fs.readFileSync(secretPath, 'utf8').trim();
        }

        return entries;
      }, {} as Record<string, string>);

      return vaults;
    }, {} as Record<string, Record<string, string>>);
  }

  private setLocalSecret(secret: string, toPath: string): void {
    // Load a secret from the AAT vault using azure cli
    const result = execSync('az keyvault secret show --vault-name idam-idam-aat -o tsv --query value --name ' + secret);
    set(config, toPath, result.toString().replace('\n', ''));
  }
}
