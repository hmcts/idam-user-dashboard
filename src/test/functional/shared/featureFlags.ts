import { event } from 'codeceptjs';
import { FeatureFlags } from '../../../main/app/feature-flags/FeatureFlags';
import { LaunchDarkly } from '../../../main/app/feature-flags/LaunchDarklyClient';
import { isArrayEmpty, isObjectEmpty } from '../../../main/utils/utils';
const colors = require('chalk');

module.exports = function() {
  let flagValues: { [key: string]: boolean };

  event.dispatcher.on(event.all.before, async function () {
    const launchDarkly = new LaunchDarkly('idam-user-dashboard', process.env.LAUNCHDARKLY_SDK_KEY);
    flagValues = await new FeatureFlags(launchDarkly).getAllFlagValues();
    launchDarkly.closeConnection();
  });

  event.dispatcher.on(event.test.before, function (test) {
    if(!isArrayEmpty(test.opts?.featureFlags) && !isObjectEmpty(flagValues) && !test.opts.featureFlags.every(flag => flagValues[flag])) {
      test.run = function skip() {
        console.warn(`[00]   ${colors.yellow.bold('S')} ${test.title}`);
        this.skip();
      };
    }
  });
};
