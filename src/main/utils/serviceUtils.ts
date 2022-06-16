import { SelectItem } from '../interfaces/SelectItem';
import { Service } from '../interfaces/Service';
import { Role } from '../interfaces/Role';
import { rolesExist } from './roleUtils';

const getServicesWithPrivateBetaRole = (services: Service[], rolesMap: Map<string, Role>): Service[] => {
  return services
    .filter(service => service.onboardingRoles.length > 0)
    .filter(service => rolesExist(service.onboardingRoles, rolesMap));
};

export const hasPrivateBetaServices = (services: Service[], rolesMap: Map<string, Role>): boolean => {
  return services.some(service => service.onboardingRoles.length > 0 && rolesExist(service.onboardingRoles, rolesMap));
};

export const getServicesForSelect = (services: Service[], rolesMap: Map<string, Role>): SelectItem[] => {
  const privateBetaServices = getServicesWithPrivateBetaRole(services, rolesMap);
  return privateBetaServices
    .sort((a: Service, b: Service) => a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1)
    .map((service) => ({ value: service.label, text: service.label, selected: false }));
};
