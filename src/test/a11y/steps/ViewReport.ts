import * as urls from '../../../main/utils/urls';
import {testAccessibilityGet, testAccessibilityPost, createParameterisedUrl } from '../utils';


export const ViewReportTest = () => {
  const pageUrl = createParameterisedUrl(urls.VIEW_REPORT_URL, {});

  testAccessibilityGet(pageUrl);

  testAccessibilityPost(pageUrl, {});
};
