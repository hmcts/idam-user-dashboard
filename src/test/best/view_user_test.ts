Feature('view_user');

Before(async ({ setupDAO, login }) => {

  console.log('In Before');
  await setupDAO.setupAdmin();
  console.log('admin identity is %j', codeceptjs.container.support('adminIdentity'));
  login('admin');

});

Scenario('test something',  ({ I }) => {
  I.amOnPage('/');
  I.see('What do you want to do?');
});
