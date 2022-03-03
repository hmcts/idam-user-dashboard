import { LaunchDarkly } from '../../../../main/app/feature-flags/LaunchDarklyClient';
import { FeatureFlags } from '../../../../main/app/feature-flags/FeatureFlags';
import { isArrayEmpty, isObjectEmpty } from '../../../../main/utils/utils';
import { threadId } from 'worker_threads';
import { yellow } from 'chalk';

class FeatureFlagHelper extends Helper {
  private flagValues: { [key: string]: boolean };

  async _init() {
    const launchDarkly = new LaunchDarkly('idam-user-dashboard', process.env.LAUNCHDARKLY_SDK_KEY);
    this.flagValues = await new FeatureFlags(launchDarkly).getAllFlagValues();
    launchDarkly.closeConnection();
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  _before(test: Mocha.Test & { opts: any }) {
    if(!isArrayEmpty(test.opts?.featureFlags) && !isObjectEmpty(this.flagValues) && !test.opts.featureFlags.every(flag => this.flagValues[flag])) {
      if(codeceptjs.config.get().name === 'functional') {
        console.warn(`[0${threadId}]   ${yellow.bold('S')} ${test.title}`);
      }

      test.opts.skipInfo = { message: 'Test skipped due to one or more feature flags disabled: ' + test.opts.featureFlags };
      test.run = () => test.skip();
    }
  }
}

module.exports = FeatureFlagHelper;
