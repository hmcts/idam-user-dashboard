/// <reference types='codeceptjs' />
type steps_file = typeof import('../common/steps_file');
type setupDAO = typeof import('../common/dao/SetupDao');
type A11yHelper = import('codeceptjs-a11y-helper');
type ChaiWrapper = import('codeceptjs-chai');

declare namespace CodeceptJS {
  interface SupportObject { I: I, current: any, setupDAO: setupDAO }
  interface Methods extends Playwright, A11yHelper, REST, JSONResponse, ChaiWrapper, ApiDataFactory {}
  interface I extends ReturnType<steps_file>, WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}
