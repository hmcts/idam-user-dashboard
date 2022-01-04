Feature('testing');

Scenario('test1', ({I}) => {
  I.amOnPage('/login');
  I.resizeWindow(2200, 1200);
});


Scenario('test2', ({I}) => {
  I.amOnPage('/login');
  I.resizeWindow(2200, 1200);
});

