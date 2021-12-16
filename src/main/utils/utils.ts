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
