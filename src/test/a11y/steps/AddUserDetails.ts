import * as urls from '../../../main/utils/urls';
import {testAccessibilityGet, testAccessibilityPost, createParameterisedUrl } from '../utils';

interface UserDetails {
    email: string;
}

export const AddUserDetailsTest = () => {
  const pageUrl = createParameterisedUrl(urls.ADD_USER_DETAILS_URL, {});

  testAccessibilityGet(pageUrl);

  const userDetails: UserDetails = {
    email: 'nonExistingUSer@idam.test'
  };

  testAccessibilityPost(pageUrl, userDetails);
};
