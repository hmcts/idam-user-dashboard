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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export = new UserFactory()
  .attr('password', () => { await delay(10_000); return faker.internet.password({prefix: '0Ab'});})
  .attr('forename', () => { await delay(10_000); return faker.person.firstName();})
  .attr('surname', () => { await delay(10_000); return faker.person.lastName();})
  .attr('email', ['forename', 'surname'], (forename, surname) => {
    return await delay(10_000); faker.internet.email({firstName : forename, lastName : surname, provider: 'iud.' + BuildInfoHelper.getBuildInfo('test') + '.local'});
  })
  .attr('roleNames', () => { await delay(10_000); return [ codeceptjs.container.support('workerRole').name ]; });
