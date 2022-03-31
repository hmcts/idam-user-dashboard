import '../scss/main.scss';
import { initAll } from 'govuk-frontend';
import RolesList from './RoleList';

initAll();

let $roleLists = document.querySelectorAll('[data-module="role-list"]');
$roleLists.forEach($roleList => {
  new RolesList($roleList).init();
});
