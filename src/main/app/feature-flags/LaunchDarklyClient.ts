import config from 'config';
import { basicLogger, init, LDClient, LDContext, LDOptions } from '@launchdarkly/node-server-sdk';
import { FeatureFlagClient } from './FeatureFlags';

export class LaunchDarkly implements FeatureFlagClient {
  private readonly client: LDClient;
  private readonly ldContext: LDContext;

  constructor(user: string = config.get('featureFlags.launchdarkly.ldUser'), sdkKey: string = config.get('featureFlags.launchdarkly.sdkKey')) {
    this.ldContext = { kind: 'user', key: user };

    let ldConfig: LDOptions = {};

    if (!sdkKey) {
      ldConfig = { offline: true, logger: basicLogger({ level: 'error' }) };
    }

    this.client = init(sdkKey || '', ldConfig);
  }

  public async getFlagValue(flag: string, defaultValue: boolean): Promise<boolean> {
    await this.client.waitForInitialization();
    return this.client.variation(flag, this.ldContext, defaultValue);
  }

  public async getAllFlagValues(defaultValue: boolean): Promise<{ [p: string]: boolean }> {
    await this.client.waitForInitialization();
    const flagMap = (await this.client.allFlagsState(this.ldContext)).allValues();
    for (const key in flagMap) {
      flagMap[key] = flagMap[key] ?? defaultValue;
    }

    return flagMap;
  }

  public onFlagChange(callback: Function, defaultValue: boolean, flag?: string): void {
    if(flag) {
      this.client.on(`update:${flag}` , async () => callback(await this.getFlagValue(flag, defaultValue)));
    } else {
      this.client.on('update' , async () => callback(await this.getAllFlagValues(defaultValue)));
    }
  }

  public closeConnection() {
    this.client.close();
  }
}
