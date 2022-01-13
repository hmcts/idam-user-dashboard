

type stepsFile = typeof import('./steps_file');
type CustomHelper = import('./shared/idam-helper');

declare namespace CodeceptJS {
  interface SupportObject { I: I, stepsFile: stepsFile}
  interface Methods extends Playwright, CustomHelper {}
  interface I extends ReturnType<stepsFile> {}
  interface I extends WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}
