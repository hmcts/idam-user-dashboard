const { Factory } = require('rosie');
const { faker } = require('@faker-js/faker');

export = new Factory()
  .attr('name', () => { return 'iud-role-' + + faker.word.verb() + '-' + faker.word.noun();})
  .attr('assignableRoleNames', []);
