Feature('testing');

Scenario('test1', ({ I }) => {
  I.amOnPage('https://www.amazon.co.uk/');
  I.resizeWindow(2200,1200);
  I.click('#twotabsearchtextbox');
  I.fillField('#twotabsearchtextbox', 'Books');
  I.pressKey('Enter');
});


Scenario('test2', ({ I }) => {
  I.amOnPage('https://www.amazon.co.uk/');
  I.resizeWindow(2200,1200);
  I.click('#twotabsearchtextbox');
  I.fillField('#twotabsearchtextbox', 'Books');
  I.pressKey('Enter');
});

Scenario('test3', ({ I }) => {
  I.amOnPage('https://www.amazon.co.uk/');
  I.resizeWindow(2200,1200);
  I.click('#twotabsearchtextbox');
  I.fillField('#twotabsearchtextbox', 'Books');
  I.pressKey('Enter');
});

Scenario('test4', ({ I }) => {
  I.amOnPage('https://www.amazon.co.uk/');
  I.resizeWindow(2200,1200);
  I.click('#twotabsearchtextbox');
  I.fillField('#twotabsearchtextbox', 'Books');
  I.pressKey('Enter');
});
