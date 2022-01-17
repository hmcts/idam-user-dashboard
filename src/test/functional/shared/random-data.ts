function randomString(length = 10) {
  return Math.random().toString(36).substring(2, length);
}

function randomAlphabeticString(length = 10) {
  let randomString = '';
  let randomAscii;
  for(let i = 0; i < length; i++) {
    randomAscii = Math.floor((Math.random() * 25) + 97);
    randomString += String.fromCharCode(randomAscii);
  }
  return randomString;
}

const testBasePrefix = 'SIDMTESTWA_' + randomAlphabeticString();

module.exports = {
  getRandomString: randomString,
  getRandomAlphabeticString: randomAlphabeticString,
  TEST_BASE_PREFIX: testBasePrefix,
  getRandomUserName: (testSuitePrefix) => testBasePrefix + testSuitePrefix + 'USER' + randomAlphabeticString(),
  getRandomRoleName: (testSuitePrefix) => testBasePrefix + testSuitePrefix + 'ROLE_' + randomString(),
  getRandomServiceName: (testSuitePrefix) => testBasePrefix + testSuitePrefix + 'SERVICE_' + randomString(),
  getRandomEmailAddress: () => randomString() + '@mailtest.gov.uk',
};
