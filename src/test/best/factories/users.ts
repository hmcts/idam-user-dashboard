const { Factory } = require('rosie');
const { faker } = require('@faker-js/faker');

class UserFactory extends Factory {

  build(attributes, options) {
    const user = super.build(attributes, options);
    return {
      password: user.password,
      user: user
    };
  }

}

export = new UserFactory()
  .attr('password', faker.internet.password())
  .attr('forename', faker.person.firstName())
  .attr('surname', faker.person.lastName())
  .attr('email', ['forename', 'surname'], (forename, surname) => {
    return faker.internet.email({firstName : forename, lastName : surname, provider: 'test.local'});
  })
  .attr('roleNames', ['caseworker']);
