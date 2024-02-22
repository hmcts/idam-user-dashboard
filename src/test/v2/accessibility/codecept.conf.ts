import {shared_config as sharedConfig} from '../common/shared_config';

export const config: CodeceptJS.MainConfig = {
  name: 'best-practice',
  tests: './*_test.ts',
  output: '../../../../functional-output/accessibility',
  include: {
    I: '../common/steps_file',
    setupDAO: '../common/dao/SetupDao.ts'
  },
  helpers: sharedConfig.helpers,
  plugins: sharedConfig.plugins
};