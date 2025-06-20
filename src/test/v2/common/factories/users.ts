const { Factory } = require('rosie');
const { faker } = require('@faker-js/faker');
import { BuildInfoHelper } from '../build_info';

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
    return faker.internet.email({firstName : forename, lastName : surname, provider: 'iud.' + BuildInfoHelper.getBuildInfo('test') + '.local'});
  })
  .attr('roleNames', () => { return [ codeceptjs.container.support('workerRole').name ]; });
