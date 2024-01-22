import * as urls from '../../../main/utils/urls';
import {testAccessibilityPost, createParameterisedUrl } from '../utils';

interface User {
    _action: string;
    _userId: string;
}

export const UserEditTest = () => {
  const pageUrl = createParameterisedUrl(urls.EDIT_USER_URL, {});

  const user: User = {
    _action: 'edit',
    _userId: 'CHILD_USER_ID'
  };

  testAccessibilityPost(pageUrl, user);
};
