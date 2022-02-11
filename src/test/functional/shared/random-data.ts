export const randomString = (length = 10) => {
  return Math.random().toString(36).substring(2, length);
};

export const randomAlphabeticString = (length = 10) => {
  let randomString = '';
  let randomAscii;
  for (let i = 0; i < length; i++) {
    randomAscii = Math.floor((Math.random() * 25) + 97);
    randomString += String.fromCharCode(randomAscii);
  }
  return randomString;
};

export const randomData= {
  getRandomString: randomString,
  getRandomAlphabeticString: randomAlphabeticString,
  getRandomEmailAddress: () => randomString() + '@mailtest.gov.uk',
};
