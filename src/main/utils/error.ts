export const MISSING_OPTION_ERROR = 'You must select an option';
export const MISSING_INPUT_ERROR = 'You must enter an email address, user ID, or SSO ID';
export const MISSING_EMAIL_ERROR = 'You must enter an email address';
export const INVALID_EMAIL_FORMAT_ERROR = 'The email address is not in the correct format';
export const TOO_MANY_USERS_ERROR = 'Error - More than one user matches your search for: ';
export const NO_USER_MATCHES_ERROR = 'No user matches your search for: ';
export const USER_UPDATE_FAILED_ERROR = 'An error occurred whilst updating user ';
export const USER_UPDATE_NO_CHANGE_ERROR = 'No changes to the user were made';

export const USER_EMPTY_FORENAME_ERROR = 'You must enter a forename for the user';
export const USER_EMPTY_SURNAME_ERROR = 'You must enter a surname for the user';
export const USER_EMPTY_EMAIL_ERROR = 'You must enter an email for the user';
export const USER_DELETE_FAILED_ERROR = 'An error occurred whilst deleting this user';
export const MISSING_USER_TYPE_ERROR = 'You must select an user type';
export const MISSING_PRIVATE_BETA_SERVICE_ERROR = 'You must select a service';
export const MISSING_ROLE_ASSIGNMENT_ERROR = 'A user must have at least one role assigned to be able to create them';
export const USER_REMOVE_SSO_ERROR = 'An error occurred whilst removing sso for this user';
export const MISSING_ROLE_INPUT_ERROR = 'You must enter a role or a list of roles (comma seperated)';
export const GENERATING_REPORT_ERROR = 'An error occurred generating the report.';
export const GENERATING_REPORT_FILE_ERROR = 'An error occurred generating the report file';
export const GENERATING_REPORT_NO_USERS_MATCHED = 'There are no users with the entered role(s).';
export const GENERATING_FILE_FAILED_TRY_AGAIN = 'There was an error compiling the report file. Please try again.';
export const GENERATING_REPORT_CITIZEN_ERROR = 'For security reasons, it is not possible to get a report on all citizen users';
export const ROLE_PERMISSION_ERROR = 'You do not have permission to create the user roles';

export const selectOptionError = (options: string) => `Select if you would like to ${options}`;

export const duplicatedEmailError = (email: string) => `The email '${email}' already exists`;
