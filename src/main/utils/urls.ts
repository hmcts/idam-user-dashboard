import config from 'config';

// External URLs
export const IDAM_PUBLIC = config.get('services.idam.url.public') as string;
export const IDAM_API = config.get('services.idam.url.api') as string;

// Exposed URLs
export const HOME_URL = '/';
export const LOGIN_URL = '/login';
export const LOGOUT_URL = '/logout';
export const OAUTH2_CALLBACK_URL = '/oauth2/callback';

export const MANAGER_USERS_URL = '/manage-users';
export const ADD_USERS_URL = '/add-users';
export const USER_DETAILS_URL = '/user-details';

// Internal URLs
export const USER_RESULTS_URL = '/user-results';
