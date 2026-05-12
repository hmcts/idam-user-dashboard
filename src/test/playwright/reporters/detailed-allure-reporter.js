const { ContentType } = require('allure-js-commons');
const AllureReporter = require('allure-playwright').default;

class DetailedAllureReporter extends AllureReporter {
  constructor(options = {}) {
    super({ detail: true, ...options });
  }

  async onTestEnd(test, result) {
    this.attachAssertionMessage(test, result);
    await super.onTestEnd(test, result);
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
}

module.exports = DetailedAllureReporter;
