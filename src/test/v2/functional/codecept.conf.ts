import {shared_config as sharedConfig} from '../common/shared_config';

export const config: CodeceptJS.MainConfig = {
  name: 'best-practice',
  tests: './sign_in_test.ts',
  output: '../../../../functional-output/functional/reports',
  include: {
    I: '../common/steps_file',
    setupDAO: '../common/dao/SetupDao.ts'
  },
  retry: 3,
  helpers: sharedConfig.helpers,
  plugins: sharedConfig.plugins
};