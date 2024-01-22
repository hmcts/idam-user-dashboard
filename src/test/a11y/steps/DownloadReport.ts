import * as urls from '../../../main/utils/urls';
import {testAccessibilityGet, createParameterisedUrl } from '../utils';


export const DownloadReportTest = () => {
  const pageUrl = createParameterisedUrl(urls.DOWNLOAD_REPORT_URL, {});

  testAccessibilityGet(pageUrl);
};
