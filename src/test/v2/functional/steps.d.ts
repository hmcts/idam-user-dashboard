/// <reference types='codeceptjs' />
type steps_file = typeof import('../common/steps_file');
type setupDAO = typeof import('../common/dao/SetupDao');
type ChaiWrapper = import('codeceptjs-chai');

declare namespace CodeceptJS {
  interface SupportObject { I: I, current: any, login: any, setupDAO: setupDAO }
  interface Methods extends Playwright, REST, JSONResponse, ChaiWrapper, ApiDataFactory {}
  interface I extends ReturnType<steps_file>, WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {
      intentionalFailure(): void;
    }
  }
}
