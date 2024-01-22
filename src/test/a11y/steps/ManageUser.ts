import * as urls from '../../../main/utils/urls';
import { testAccessibilityGet, createParameterisedUrl } from '../utils';

export const ManageUserTest = () => {
  const pageUrl = createParameterisedUrl(urls.MANAGER_USER_URL, {});

  testAccessibilityGet(pageUrl);
};
