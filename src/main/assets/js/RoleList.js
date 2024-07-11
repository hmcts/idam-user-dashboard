
function RolesList($element) {
  this.roleListClass = 'role-list';
  this.roleDataAttribute = 'role';
  this.searchBoxClass = this.roleListClass + '__search-box';
  this.roleCountClass = this.roleListClass + '__number-of-roles';
  this.filteredRoleCount = 0;

  this.$roleListContainer = $element;
  this.$roleListCheckboxes = this.$roleListContainer.querySelectorAll(`[data-${this.roleDataAttribute}]`);
  this.$searchBox = this.$roleListContainer.querySelector(`.${this.searchBoxClass}`);
  this.$hideCheckbox = this.$roleListContainer.querySelector(`#hide-disabled`);
}

// Initialize component
RolesList.prototype.init = function () {
  this.initSearchBox();
  this.initRoleCount();
  this.hideDisabled();
};

RolesList.prototype.initSearchBox = function () {
  this.$searchBox.addEventListener('input', (event) => {
    this.filterList(event.target.value);
  });
  this.$hideCheckbox.addEventListener('input', () => {
    this.hideDisabled();
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

RolesList.prototype.isHidden = function(roleElement) {
  roleElement = roleElement.parentNode;
  return roleElement.style.display === 'none';
};

RolesList.prototype.hideDisabled = function() {
  const hideDisabled = this.$hideCheckbox.checked;
  const currentFilter = this.$searchBox.value;

  [...this.$roleListCheckboxes].forEach(checkbox => {
    if (checkbox.dataset[this.roleDataAttribute].includes(currentFilter) && checkbox.disabled) {
      if (hideDisabled) {
        this.setHidden(checkbox, true);
      } else {
        this.setHidden(checkbox, false);
      }
    }
  });
};

RolesList.prototype.updateRoleCount = function () {
  const $roleCountEl = this.$roleListContainer.querySelector(`.${this.roleCountClass}`);
  let textContent = this.$roleListCheckboxes.length - this.filteredRoleCount + ' roles';

  if(this.filteredRoleCount) {
    textContent += ` (${this.filteredRoleCount} filtered)`;
  }

  $roleCountEl.textContent = textContent;
};

RolesList.prototype.filterList = function(filterBy = '') {
  const hideDisabled = this.$hideCheckbox.checked;
  filterBy = filterBy.toLowerCase();
  this.filteredRoleCount = 0;

  [...this.$roleListCheckboxes].forEach(checkbox => {
    if(!checkbox.dataset[this.roleDataAttribute].includes(filterBy)) {
      this.setHidden(checkbox, true);
      this.filteredRoleCount++;
    } else {
      if (hideDisabled && checkbox.disabled) {
        this.setHidden(checkbox, true);
      } else {
        this.setHidden(checkbox, false);
      }
    }
  });

  this.updateRoleCount();
};

export default RolesList;
