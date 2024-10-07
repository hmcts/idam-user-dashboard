const { Factory } = require('rosie');
const { faker } = require('@faker-js/faker');

class ServiceFactory extends Factory {

  build(attributes, options) {
    const service = super.build(attributes, options);
    return {
      clientId: service.clientId,
      clientSecret: service.clientSecret,
      hmctsAccess: {
        onboardingRoleNames: service.onboardingRoleNames
      },
      oauth2: {
        redirectUris: service.redirectUris
      }
    };
  }

}

export = new ServiceFactory()
  .attr('clientId', () => { return ('iud-service-' + faker.word.verb() + '-' + faker.word.noun()).normalize('NFD').replace(/[\u0300-\u036f]/g, '');})
  .attr('clientSecret', ['clientId'], (clientId) => { return clientId; })
  .attr('redirectUris', ['clientId'], (clientId) => { return ['http://' + clientId];})
  .attr('onboardingRoleNames', []);
