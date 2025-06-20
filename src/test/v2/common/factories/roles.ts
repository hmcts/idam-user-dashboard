const { Factory } = require('rosie');
const { faker } = require('@faker-js/faker');
import { BuildInfoHelper } from '../build_info';

export = new Factory()
  .attr('name', () => { return ('iud-role-' + BuildInfoHelper.getBuildInfo(faker.word.verb()) + '-' + faker.word.noun()).normalize('NFD').replace(/[\u0300-\u036f]/g, '');})
  .attr('assignableRoleNames', []);
