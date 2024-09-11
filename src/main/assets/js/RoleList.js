
function RolesList($element) {
  this.roleListClass = 'role-list';
  this.roleDataAttribute = 'role';
  this.searchBoxClass = this.roleListClass + '__search-box';
  this.roleCountClass = this.roleListClass + '__number-of-roles';
  this.roleDivClass = this.roleListClass + '__list';
  this.filteredRoleCount = 0;

  this.$roleListContainer = $element;
  this.$checkboxContainer = this.$roleListContainer.querySelector(`.${this.roleDivClass}`)
    .querySelector(`[data-module="govuk-checkboxes"]`);
  this.$checkboxContainerParent = this.$checkboxContainer.parentNode;
  this.$roleListCheckboxes = this.$roleListContainer.querySelectorAll(`[data-${this.roleDataAttribute}]`);
  this.$searchBox = this.$roleListContainer.querySelector(`.${this.searchBoxClass}`);
  this.$hideCheckbox = this.$roleListContainer.querySelector(`#hide-disabled`);
}

// Initialize component
RolesList.prototype.init = function () {
  this.initSearchBox();
  this.initRoleCount();
  this.runSearchBoxFilter();
};

RolesList.prototype.initSearchBox = function () {
  this.$searchBox.addEventListener('input', (event) => {
    this.filterList(event.target.value);
  });
  this.$hideCheckbox.addEventListener('input', () => {
    this.runSearchBoxFilter();
  });
};

RolesList.prototype.initRoleCount = function () {
  this.updateRoleCount();
};

RolesList.prototype.clearCheckboxList = function () {
  const emptyClone = this.$checkboxContainer.cloneNode(false);
  this.$checkboxContainerParent.removeChild(this.$checkboxContainer);
  this.$checkboxContainerParent.appendChild(emptyClone);
  this.$checkboxContainer = emptyClone;
};

RolesList.prototype.showElement = function(roleElement) {
  roleElement = roleElement.parentNode;
  this.$checkboxContainer.appendChild(roleElement);
};

RolesList.prototype.runSearchBoxFilter = function() {
  const currentFilter = this.$searchBox.value;
  this.filterList(currentFilter);
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
  this.clearCheckboxList();
  const hideDisabled = this.$hideCheckbox.checked;
  filterBy = filterBy.toLowerCase();
  this.filteredRoleCount = 0;

  [...this.$roleListCheckboxes].forEach(checkbox => {
    if(checkbox.dataset[this.roleDataAttribute].includes(filterBy)) {
      if (!(hideDisabled && checkbox.disabled)) {
        this.showElement(checkbox);
      }
    } else {
      this.filteredRoleCount++;
    }
  });

  this.updateRoleCount();
};

export default RolesList;
