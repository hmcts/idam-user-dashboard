export const hasProperty = (container: {}, property: string): boolean => {
  return container !== undefined && property in container;
};

export const isEmpty = (value: string): boolean => {
  return value === undefined || value === '';
};

export const isValidEmailFormat = (email: string): boolean => {
  const filter = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return filter.test(email);
};

const compareRoles = (a: string, b: string): number => {
  if (a === 'IDAM_SUPER_USER' || a === 'IDAM_ADMIN_USER') {
    return -1;
  } else if (b === 'IDAM_SUPER_USER' || b === 'IDAM_ADMIN_USER') {
    return 1;
  } else if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  }
  return 0;
};

export const sortRoles = (roles: string[]): void => {
  if (roles.length > 1) {
    roles.sort((a: string, b: string) => compareRoles(a, b));
  }
};
