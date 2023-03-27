export interface Service {
  label: string;
  description: string;
  onboardingRoles: string[];
  activationRedirectUrl?: string;
  oauth2ClientId: string;
}
