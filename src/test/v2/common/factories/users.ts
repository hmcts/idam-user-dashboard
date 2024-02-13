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
  .attr('password', () => { return faker.internet.password({prefix: '0Ab'});})
  .attr('forename', () => { return faker.person.firstName();})
  .attr('surname', () => { return faker.person.lastName();})
  .attr('email', ['forename', 'surname'], (forename, surname) => {
    return faker.internet.email({firstName : forename, lastName : surname, provider: 'test.local'});
  })
  .attr('roleNames', [ codeceptjs.container.support('workerRole').name ]);
