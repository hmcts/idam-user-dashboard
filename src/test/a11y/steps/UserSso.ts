import * as urls from '../../../main/utils/urls';
import {testAccessibilityPost, createParameterisedUrl } from '../utils';

export const UserSsoTest = () => {
  const pageUrl = createParameterisedUrl(urls.USER_DISABLE_SSO_URL, {});

  testAccessibilityPost(pageUrl, {});
};
