import * as urls from '../../../main/utils/urls';
import {testAccessibilityPost, createParameterisedUrl } from '../utils';

interface User {
    _action: string;
    _userId: string;
}

export const UserDeleteTest = () => {
  const pageUrl = createParameterisedUrl(urls.USER_DELETE_URL, {});

  const user: User = {
    _action: 'delete',
    _userId: 'CHILD_USER_ID'
  };

  testAccessibilityPost(pageUrl, user);
};
