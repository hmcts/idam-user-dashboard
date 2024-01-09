/// <reference types='codeceptjs' />
type steps_file = typeof import('./steps_file');
type setupDAO = typeof import('./dao/SetupDao');
type Testing_support = import('./helpers/testing_support_helper');

declare namespace CodeceptJS {
  interface SupportObject { I: I, current: any, login: any, setupDAO: setupDAO }
  interface Methods extends Playwright, REST, JSONResponse, Testing_support {}
  interface I extends ReturnType<steps_file>, WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}
