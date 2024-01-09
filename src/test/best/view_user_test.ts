Feature('view_user');

BeforeSuite(async ({ I, setupDAO }) => {

  console.log('In BeforeSuite');

});

Before(async ({ I, setupDAO, login }) => {

  console.log('In Before');
  await setupDAO.setupAdmin();
  console.log('admin identity is %j', codeceptjs.container.support('adminIdentity'));
  login('admin');

});

Scenario('test something',  ({ I }) => {
  I.amOnPage('/');
  I.see('What do you want to do?');
});
