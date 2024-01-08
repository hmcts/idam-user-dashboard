Feature('view_user');

BeforeSuite(async ({ I, setupDAO }) => {

  console.log("In BeforeSuite");
  console.log("process value is " + process.env.SMOKE_TEST_USER_USERNAME);

  setupDAO.getToken();

});

Scenario('test something',  ({ I }) => {
  I.amOnPage('/');
  I.seeInCurrentUrl('/details');
});
