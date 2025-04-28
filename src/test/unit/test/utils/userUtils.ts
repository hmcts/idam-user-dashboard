
export const createV1User = (roleNames: string[]) => {
  return {
    id: 'test-user-id',
    forename: 'test-forename',
    surname: 'test-surname',
    email: 'test@test.local',
    active: true,
    roles: roleNames
  };
};

export const convertToV2User = (user: any) => {
  return {
    id: user.id,
    forename: user.forename,
    surname: user.surname,
    email: user.email,
    active: user.active,
    roleNames: user.roles
  };
};