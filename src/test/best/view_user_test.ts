Feature('view_user');

Scenario('test something',  ({ I }) => {
    I.amOnPage('/');
    I.seeInCurrentUrl('/details');
});
