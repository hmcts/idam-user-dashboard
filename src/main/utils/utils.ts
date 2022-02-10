export const hasProperty = (container: {}, property: string): boolean => {
  return container !== undefined && property in container;
};

export const isEmpty = (value: string): boolean => {
  return value === undefined || value === '';
};

export const isObjectEmpty = (obj: {}): boolean => {
  return Object.keys(obj).length === 0;
};

export const isValidEmailFormat = (email: string): boolean => {
  const filter = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return filter.test(email);
};

const isDefaultRole = (role: string): boolean => {
  return role === 'IDAM_SUPER_USER'
    || role === 'IDAM_ADMIN_USER'
    || role === 'IDAM_SYSTEM_OWNER';
};

const compareRoles = (a: string, b: string): number => {
  if (isDefaultRole(a)) {
    return -1;
  } else if (isDefaultRole(b)) {
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

export const convertISODateTimeToUTCFormat = (date: string): string => {
  const result = new Date(date).toUTCString();
  return result === 'Invalid Date' ? '' : result;
};
