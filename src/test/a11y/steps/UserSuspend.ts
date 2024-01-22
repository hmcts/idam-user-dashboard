import * as urls from '../../../main/utils/urls';
import {testAccessibilityPost, createParameterisedUrl } from '../utils';

interface User {
    _action: string;
    _userId: string;
}

export const UserSuspendTest = () => {
  const pageUrl = createParameterisedUrl(urls.USER_SUSPEND_URL, {});

  const user: User = {
    _action: 'suspend',
    _userId: 'CHILD_USER_ID'
  };

  testAccessibilityPost(pageUrl, user);
};
