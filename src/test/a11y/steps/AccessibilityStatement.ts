import * as urls from '../../../main/utils/urls';
import { testAccessibilityGet, createParameterisedUrl } from '../utils';

export const AccessibilityStatementTest = () => {
  const pageUrl = createParameterisedUrl(urls.ACCESSIBILITY_STATEMENT, {});

  testAccessibilityGet(pageUrl);
};
