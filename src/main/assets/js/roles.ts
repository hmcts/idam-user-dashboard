import $ from 'jquery';
import {RoleItem} from '../../interfaces/RoleItem';

export class RolesController {
  private contentId = '#main-content';
  private containerId = '#container';
  private searchFilterId = '#search';
  private numberOfRoles = '#numberOfRoles';
  private rolesData = '#roleList';
  private roleResultsSection = '#roleList > tbody';

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    $(() => {
      if($(this.containerId).length) { // so that this doesn't load on each page
        this.setUpData();
        this.setUpDynamicSearchFilter();
      }
    });
  }

  private setUpData(): void {
    const filteredRoles = this.filterRoles(this.getExistingRoleData(), $(this.searchFilterId).val() as string);
    $(this.roleResultsSection).html(this.getRolesTableBody(filteredRoles));
    $(this.numberOfRoles).show().text('Showing '
      + filteredRoles.filter(d => d.visible).length + ' results');
  }

  private getExistingRoleData(): RoleItem[] {
    const roleItems = [] as RoleItem[];
    $(this.rolesData).find('roles').each(function(i, row) {
      const roleItem = {} as RoleItem;
      roleItem.name = $(row).text();
      roleItem.row = $(row);
      roleItems.push(roleItem);
    });
    return roleItems;
  }

  private filterRoles(roleItems: RoleItem[], searchFilterValue: string): RoleItem[] {
    roleItems.forEach((roleItem) => {
      if (searchFilterValue.trim().length > 0) {
        roleItem.visible = roleItem.name.toLowerCase().includes(searchFilterValue.toString().toLowerCase());
      } else
        roleItem.visible = true;
    });

    return roleItems;
  }

  private getRolesTableBody(filteredRoles: RoleItem[]): string {
    let tableData = '';
    $.each(filteredRoles,function(index,value): void {
      tableData += (!value.visible
        ? '<tr class="govuk-table__row courtTableRowHidden" hidden>' : '<tr class="govuk-table__row>">') +
        value.row.html() +
        '</tr>';
    });
    return tableData;
  }

  private setUpDynamicSearchFilter(): void {
    $(this.contentId).on('input', `input[name=${this.searchFilterId}]`, e => {
      e.preventDefault();
      this.setUpData();
    });
  }
}
