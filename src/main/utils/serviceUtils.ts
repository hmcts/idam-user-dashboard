import { SelectItem } from '../interfaces/SelectItem';
import { Service } from '../interfaces/Service';
import { arrayContainsSubstring } from './utils';

export const PRIVATE_BETA_ROLE = 'private-beta';

const getServicesWithPrivateBetaRole = (services: Service[]): Service[] => {
  return services.filter(service => service.onboardingRoles.length > 0 && arrayContainsSubstring(service.onboardingRoles, PRIVATE_BETA_ROLE));
};

export const hasPrivateBetaServices = (services: Service[]): boolean => {
  return services.some(service => service.onboardingRoles.length > 0 && arrayContainsSubstring(service.onboardingRoles, PRIVATE_BETA_ROLE));
};

export const getServicesForSelect = (services: Service[]): SelectItem[] => {
  const privateBetaServices = getServicesWithPrivateBetaRole(services);

  return privateBetaServices.map((service) => ({ value: service.label, text: service.label, selected: false }));
};
