// /// <reference types='codeceptjs' />
// type steps_file = typeof import('./steps_file.js');
//
// declare namespace CodeceptJS {
//   interface SupportObject { I: I, current: any }
//   interface Methods extends Playwright {}
//   //interface I extends ReturnType<steps_file> {}
//   interface I extends WithTranslation<Methods> {}
//   namespace Translation {
//     interface Actions {}
//   }
// }

/// <reference types='codeceptjs' />
type customMethods = typeof import('./steps_file');
type CustomHelper = import('./shared/idam-helper');

declare namespace CodeceptJS {
  interface SupportObject { I: I, customMethods: customMethods}
  interface Methods extends Playwright, CustomHelper {}
  interface I extends WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}
