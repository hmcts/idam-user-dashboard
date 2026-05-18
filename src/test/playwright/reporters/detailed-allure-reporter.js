const { ContentType } = require('allure-js-commons');
const AllureReporter = require('allure-playwright').default;

class DetailedAllureReporter extends AllureReporter {
  constructor(options = {}) {
    super({ detail: true, ...options });
    this.collapseSingleProjectSuites = options.collapseSingleProjectSuites === true;
  }

  async onTestEnd(test, result) {
    this.attachAssertionMessage(test, result);
    await this.withCollapsedSingleProjectSuite(test, () => super.onTestEnd(test, result));
  }

  attachAssertionMessage(test, result) {
    if (!result.error?.message || !this.allureRuntime) {
      return;
    }

    const testUuid = this.allureResultsUuids.get(test.id);
    if (!testUuid) {
      return;
    }

    this.allureRuntime.writeAttachment(
      testUuid,
      undefined,
      'assertion-message',
      Buffer.from(result.error.message, 'utf8'),
      { contentType: ContentType.TEXT },
    );
  }

  async withCollapsedSingleProjectSuite(test, callback) {
    if (!this.collapseSingleProjectSuites || this.config?.projects?.length !== 1) {
      await callback();
      return;
    }

    const parent = test.parent;
    const originalTitlePath = parent.titlePath;
    const titlePath = originalTitlePath.call(parent);
    const suiteTitles = titlePath.slice(3).filter(Boolean);

    if (suiteTitles.length === 0) {
      await callback();
      return;
    }

    parent.titlePath = () => ['', suiteTitles.join(' > ')];
    try {
      await callback();
    } finally {
      parent.titlePath = originalTitlePath;
    }
  }
}

module.exports = DetailedAllureReporter;
