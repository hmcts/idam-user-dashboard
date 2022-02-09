import config from 'config';
import launchDarkly, { LDClient, LDUser } from 'launchdarkly-node-server-sdk';
import { FeatureFlagClient } from './FeatureFlags';

export class LaunchDarkly implements FeatureFlagClient {

  constructor(private readonly client: LDClient, private readonly ldUser: LDUser) {
    this.ldUser = { key: config.get('featureFlags.launchdarkly.ldUser') };
    this.client = launchDarkly.init(config.get('featureFlags.launchdarkly.sdkKey'), { diagnosticOptOut: true });
  }

  public async getFlagValue(flag: string, defaultValue: boolean): Promise<boolean> {
    return this.client.variation(flag, this.ldUser, defaultValue);
  }

  public async getAllFlagValues(defaultValue: boolean): Promise<{ [p: string]: boolean }> {
    const flagMap = (await this.client.allFlagsState(this.ldUser)).allValues();
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
}
