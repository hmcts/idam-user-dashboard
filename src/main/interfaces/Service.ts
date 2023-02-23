export interface Service {
  label: string;
  description: string;
  onboardingRoles: string[];
  activationRedirectUrl?: string;
}
