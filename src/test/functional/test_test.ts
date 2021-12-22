Feature('testing');

Scenario('test1 @Nightly', ({ I }) => {
  I.amOnPage('/login');
  I.resizeWindow(2200,1200);
});

Scenario('test2 @Nightly', ({ I }) => {
  I.amOnPage('/login');
  I.resizeWindow(2200,1200);
});

Scenario('test3 @Nightly', ({ I }) => {
  I.amOnPage('/login');
  I.resizeWindow(2200,1200);
});

Scenario('test4', ({ I }) => {
  I.amOnPage('/login');
  I.resizeWindow(2200,1200);
});
