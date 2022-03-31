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

export const isArrayEmpty = (value: Array<any>): boolean => {
  return value === undefined || value.length === 0;
};

export const isString = (variable: any) => {
  return (typeof variable === 'string' || variable instanceof String);
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

export const obfuscateEmail = (value: string): string => {
  if (value.includes('@')) {
    // obfuscate at least half of the username, and leave maximum of 3 characters unobfuscated
    const elements = value.split('@');
    const usernameHalfLength = Math.floor(elements[0].length * 1 / 2);
    const usernameLengthToKeep = usernameHalfLength > 3 ? 3 : usernameHalfLength;
    return elements[0].split('').map((letter, index) => index + 1 > usernameLengthToKeep ? '*' : letter).join('') + '@' + elements[1];
  }
  return value;
};

export const possiblyEmail = (value: string): boolean => {
  return value.includes('@');
};

export const getObjectVariation = (original: {[key: string]: any}, updated: {[key: string]: any}) => {
  const variation = {
    added: [] as string[],
    removed: [] as string[],
    changed: [] as string[]
  };

  variation.added = Object.keys(updated).filter(key => !Object.keys(original).includes(key));
  variation.removed = Object.keys(original).filter(key => !Object.keys(updated).includes(key));
  variation.changed = Object.keys(original).filter(key => updated[key] !== original[key]);
  variation.changed = variation.changed.filter(key => !variation.removed.includes(key));

  return variation;
};

export const convertToArray = (value: string | string[]): string[] => {
  return Array.isArray(value) ? value : value.split(/\r?\n/);
};

export const findDifferentElements = (arrayA: string[], arrayB: string[]): string[] => {
  const differentElements: string[] = [];
  arrayA
    .filter(e => !arrayB.includes(e))
    .forEach(e => differentElements.push(e));
  return differentElements;
};
