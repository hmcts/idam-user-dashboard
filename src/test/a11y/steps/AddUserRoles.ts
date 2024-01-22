import * as urls from '../../../main/utils/urls';
import {testAccessibilityPost, createParameterisedUrl } from '../utils';

export const AddUserRolesTest = () => {
  const pageUrl = createParameterisedUrl(urls.ADD_USER_ROLES_URL, {});

  testAccessibilityPost(pageUrl, {});
};
