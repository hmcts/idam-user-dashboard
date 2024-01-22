import * as urls from '../../../main/utils/urls';
import {testAccessibilityGet, testAccessibilityPost, createParameterisedUrl } from '../utils';


export const GenerateReportTest = () => {
  const pageUrl = createParameterisedUrl(urls.GENERATE_REPORT_URL, {});

  testAccessibilityGet(pageUrl);

  testAccessibilityPost(pageUrl, {});
};
