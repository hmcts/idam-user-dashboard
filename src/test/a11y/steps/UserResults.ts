import * as urls from '../../../main/utils/urls';
import {testAccessibilityGet, testAccessibilityPost, createParameterisedUrl } from '../utils';
import {randomData} from '../../functional/shared/random-data';

interface UserResult {
    search: string;
}

export const UserResultsTest = () => {
  const pageUrl = createParameterisedUrl(urls.USER_DETAILS_URL, {});

  testAccessibilityGet(pageUrl);

  const userResult: UserResult = {
    search: 'TEST_IDAM_ACCESSIBILTY_' + randomData.getRandomString() + '@idam.test'
  };

  testAccessibilityPost(pageUrl, userResult);
};
