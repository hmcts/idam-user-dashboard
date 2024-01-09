// in this file you can append custom step methods to 'I' object

export = function() {
  return actor({

    loginAs(email, password) {
      this.amOnPage('/');
      this.fillField('Email', email);
      this.fillField('Password', secret(password));
      this.click('Sign in');  
    }
  });
}
