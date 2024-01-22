import * as urls from '../../../main/utils/urls';
import {testAccessibilityPost, createParameterisedUrl } from '../utils';

export const AddPrivateBetaServiceTest = () => {
  const pageUrl = createParameterisedUrl(urls.ADD_PRIVATE_BETA_SERVICE_URL, {});

  testAccessibilityPost(pageUrl, {});
};
