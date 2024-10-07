const { Factory } = require('rosie');
const { faker } = require('@faker-js/faker');

export = new Factory()
  .attr('name', () => { return ('iud-role-' + faker.word.verb() + '-' + faker.word.noun()).normalize('NFD').replace(/[\u0300-\u036f]/g, '');})
  .attr('assignableRoleNames', []);
