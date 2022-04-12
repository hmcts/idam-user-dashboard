
function RolesList($element) {
  this.roleListClass = 'role-list';
  this.roleDataAttribute = 'role';
  this.searchBoxClass = this.roleListClass + '__search-box';
  this.roleCountClass = this.roleListClass + '__number-of-roles';
  this.filteredRoleCount = 0;

  this.$roleListContainer = $element;
  this.$roleListCheckboxes = this.$roleListContainer.querySelectorAll(`[data-${this.roleDataAttribute}]`);
}

// Initialize component
RolesList.prototype.init = function () {
  this.initSearchBox();
  this.initRoleCount();
};

RolesList.prototype.initSearchBox = function () {
  const $searchBoxEl = this.$roleListContainer.querySelector(`.${this.searchBoxClass}`);
  $searchBoxEl.addEventListener('input', (event) => {
    this.filterList(event.target.value);
  });
};

RolesList.prototype.initRoleCount = function () {
  this.updateRoleCount();
};

RolesList.prototype.setHidden = function(roleElement, state) {
  roleElement = roleElement.parentNode;

  if(state) {
    roleElement.style.display = 'none';
  } else {
    roleElement.style.removeProperty('display');
  }
  roleElement.hidden = state;
};

RolesList.prototype.filterList = function(filterBy = '') {
  filterBy = filterBy.toLowerCase();
  this.filteredRoleCount = 0;

  [...this.$roleListCheckboxes].forEach(checkbox => {
    if(!checkbox.dataset[this.roleDataAttribute].includes(filterBy)) {
      this.setHidden(checkbox, true);
      this.filteredRoleCount++;
    } else {
      this.setHidden(checkbox, false);
    }
  });

  this.updateRoleCount();
};

RolesList.prototype.updateRoleCount = function () {
  const $roleCountEl = this.$roleListContainer.querySelector(`.${this.roleCountClass}`);
  let textContent = this.$roleListCheckboxes.length - this.filteredRoleCount + ' roles';

  if(this.filteredRoleCount) {
    textContent += ` (${this.filteredRoleCount} filtered)`;
  }

  $roleCountEl.textContent = textContent;
};

export default RolesList;
