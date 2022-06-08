import { SelectItem } from '../interfaces/SelectItem';
import { Service } from '../interfaces/Service';

const getServicesWithPrivateBetaRole = (services: Service[]): Service[] => {
  return services.filter(service => service.onboardingRoles.length > 0);
};

export const hasPrivateBetaServices = (services: Service[]): boolean => {
  return services.some(service => service.onboardingRoles.length > 0);
};

export const getServicesForSelect = (services: Service[]): SelectItem[] => {
  const privateBetaServices = getServicesWithPrivateBetaRole(services);

  return privateBetaServices.map((service) => ({ value: service.label, text: service.label, selected: false }));
};
