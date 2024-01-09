Feature('view_user');

BeforeSuite(async ({ I, setupDAO }) => {

  console.log("In BeforeSuite");
  console.log("process value is " + process.env.SMOKE_TEST_USER_USERNAME);

  codeceptjs.container.append({
    support: {
      james: 'hello world'
    }
  });

});

Before(async ({ I, setupDAO, login }) => {

  console.log("In Before");
  await setupDAO.setupAdmin();
  console.log('admin identity is %j', codeceptjs.container.support('adminIdentity'));
  login('admin');

});

Scenario('test something',  ({ I }) => {
  I.amOnPage('/');
  I.see('What do you want to do?');
});
