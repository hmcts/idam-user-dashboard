import * as urls from '../../../main/utils/urls';
import { testAccessibilityGet, createParameterisedUrl } from '../utils';

export const AddUserTest = () => {
  const pageUrl = createParameterisedUrl(urls.ADD_USER_URL, {});

  testAccessibilityGet(pageUrl);
};
