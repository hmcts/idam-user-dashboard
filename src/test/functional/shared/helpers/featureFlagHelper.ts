import { LaunchDarkly } from '../../../../main/app/feature-flags/LaunchDarklyClient';
import { FeatureFlags } from '../../../../main/app/feature-flags/FeatureFlags';
import { isArrayEmpty, isObjectEmpty } from '../../../../main/utils/utils';
const colors = require('chalk');

class FeatureFlagHelper extends Helper {
  private featureFlags: FeatureFlags;
  private flagValues: { [key: string]: boolean };

  async _init() {
    const launchDarkly = new LaunchDarkly('idam-user-dashboard', process.env.LAUNCHDARKLY_SDK_KEY);
    this.featureFlags = new FeatureFlags(launchDarkly);
    this.flagValues = await this.featureFlags.getAllFlagValues();
    launchDarkly.closeConnection();
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  _before(test: Mocha.Test & { opts: any }) {
    if(!isArrayEmpty(test.opts?.featureFlags) && !isObjectEmpty(this.flagValues) && !test.opts.featureFlags.every(flag => this.flagValues[flag])) {
      if(codeceptjs.config.get().name === 'functional') {
        console.warn(`[00]   ${colors.yellow.bold('S')} ${test.title}`);
      }

      test.opts.skipInfo = { message: 'Test skipped due to one or more feature flags disabled: ' + test.opts.featureFlags };
      test.run = () => test.skip();
    }
  }
}

module.exports = FeatureFlagHelper;
