import { Service } from '../../../../main/interfaces/Service';
import {
  getServicesForSelect,
  hasPrivateBetaServices
} from '../../../../main/utils/serviceUtils';

describe('serviceUtils', () => {
  const service1 = 'Service1';
  const service2 = 'Service2';
  const service3 = 'Service3';
  const service4 = 'Service4';
  const service5 = 'Service5';
  const privateBetaRole = 'service-private-beta';
  const otherRole1 = 'other1';
  const otherRole2 = 'other2';

  describe('hasPrivateBetaServices', () => {
    test('Should return true when one of the services has "private-beta" onboarding roles', async () => {
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
            otherRole1,
            privateBetaRole
          ]
        },
        {
          label: service3,
          description: service3,
          onboardingRoles: [
            otherRole1
          ]
        },
        {
          label: service4,
          description: service4,
          onboardingRoles: [
            otherRole2
          ]
        }
      ];

      expect(hasPrivateBetaServices(testServices)).toBeTruthy();
    });

    test('Should return false when none of the services has "private-beta" onboarding roles', async () => {
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
            otherRole1,
            otherRole2
          ]
        },
        {
          label: service3,
          description: service3,
          onboardingRoles: [
            otherRole1
          ]
        }
      ];

      expect(hasPrivateBetaServices(testServices)).toBeFalsy();
    });
  });

  describe('getServicesForSelect', () => {
    test('Should return select items for services where some of the onboarding roles have "private-beta"', async () => {
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
            otherRole1,
            privateBetaRole
          ]
        },
        {
          label: service3,
          description: service3,
          onboardingRoles: [
            otherRole1
          ]
        },
        {
          label: service4,
          description: service4,
          onboardingRoles: [
            otherRole2
          ]
        },
        {
          label: service5,
          description: service5,
          onboardingRoles: [
            privateBetaRole
          ]
        }
      ];

      const results = getServicesForSelect(testServices);
      expect(results).toHaveLength(2);
      expect(results[0]).toStrictEqual({
        value: service2,
        text: service2,
        selected: false
      });
      expect(results[1]).toStrictEqual({
        value: service5,
        text: service5,
        selected: false
      });
    });

    test('Should return empty array when no service has onboarding roles of "private-beta"', async () => {
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
            otherRole1,
            otherRole2
          ]
        },
        {
          label: service3,
          description: service3,
          onboardingRoles: [
            otherRole1
          ]
        }
      ];

      const results = getServicesForSelect(testServices);
      expect(results).toHaveLength(0);
    });
  });
});
