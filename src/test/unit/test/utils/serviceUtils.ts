import { Service } from '../../../../main/interfaces/Service';
import {
  getServicesForSelect,
  hasPrivateBetaServices
} from '../../../../main/utils/serviceUtils';
import { Role } from '../../../../main/interfaces/Role';

describe('serviceUtils', () => {
  const service1 = 'Service1';
  const service2 = 'Service2';
  const service3 = 'Service3';
  const service4 = 'Service4';
  const service5 = 'Service5';
  const role1 = 'other1';
  const role2 = 'other2';
  const nonExistingRole = 'nonExisting';
  const rolesMap = new Map<string, Role>([
    [role1, { id: role1, name: role1, description: role1, assignableRoles: [], conflictingRoles: [], assigned: false }],
    [role2, { id: role2, name: role2, description: role2, assignableRoles: [], conflictingRoles: [], assigned: false }]
  ]);

  describe('hasPrivateBetaServices', () => {
    test('Should return true when one of the services has onboarding roles', async () => {
      const testServices: Service[] = [
        {
          label: service1,
          description: service1,
          onboardingRoles: []
        },
        {
          label: service2,
          description: service2,
          onboardingRoles: [
            role1
          ]
        },
        {
          label: service3,
          description: service3,
          onboardingRoles: []
        }
      ];

      expect(hasPrivateBetaServices(testServices, rolesMap)).toBeTruthy();
    });

    test('Should return true when one of the services has onboarding roles which does not exist', async () => {
      const testServices: Service[] = [
        {
          label: service1,
          description: service1,
          onboardingRoles: []
        },
        {
          label: service2,
          description: service2,
          onboardingRoles: [
            nonExistingRole
          ]
        },
        {
          label: service3,
          description: service3,
          onboardingRoles: []
        }
      ];

      expect(hasPrivateBetaServices(testServices, rolesMap)).toBeFalsy();
    });

    test('Should return false when none of the services has onboarding roles', async () => {
      const testServices: Service[] = [
        {
          label: service1,
          description: service1,
          onboardingRoles: []
        },
        {
          label: service2,
          description: service2,
          onboardingRoles: []
        },
        {
          label: service3,
          description: service3,
          onboardingRoles: []
        }
      ];

      expect(hasPrivateBetaServices(testServices, rolesMap)).toBeFalsy();
    });
  });

  describe('getServicesForSelect', () => {
    test('Should return select items for services with onboarding roles', async () => {
      const testServices: Service[] = [
        {
          label: service1,
          description: service1,
          onboardingRoles: []
        },
        {
          label: service5,
          description: service5,
          onboardingRoles: [
            role1
          ]
        },
        {
          label: service3,
          description: service3,
          onboardingRoles: [
            role2
          ]
        },
        {
          label: service2,
          description: service2,
          onboardingRoles: []
        },
        {
          label: service4,
          description: service4,
          onboardingRoles: [
            role1,
            role2
          ]
        }
      ];

      const results = getServicesForSelect(testServices, rolesMap);
      expect(results).toHaveLength(3);
      expect(results[0]).toStrictEqual({
        value: service3,
        text: service3,
        selected: false
      });
      expect(results[1]).toStrictEqual({
        value: service4,
        text: service4,
        selected: false
      });
      expect(results[2]).toStrictEqual({
        value: service5,
        text: service5,
        selected: false
      });
    });

    test('Should return empty array for services with onboarding roles which do not exist', async () => {
      const testServices: Service[] = [
        {
          label: service1,
          description: service1,
          onboardingRoles: [nonExistingRole]
        },
        {
          label: service2,
          description: service2,
          onboardingRoles: []
        },
        {
          label: service3,
          description: service3,
          onboardingRoles: [
            role1,
            role2,
            nonExistingRole
          ]
        }
      ];

      const results = getServicesForSelect(testServices, rolesMap);
      expect(results).toHaveLength(0);
    });

    test('Should return empty array when no service has onboarding roles', async () => {
      const testServices: Service[] = [
        {
          label: service1,
          description: service1,
          onboardingRoles: []
        },
        {
          label: service2,
          description: service2,
          onboardingRoles: []
        },
        {
          label: service3,
          description: service3,
          onboardingRoles: []
        }
      ];

      const results = getServicesForSelect(testServices, rolesMap);
      expect(results).toHaveLength(0);
    });
  });
});
