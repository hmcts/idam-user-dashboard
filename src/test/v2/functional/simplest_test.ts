Feature('My First Test');

Scenario('test something', ({ I }) => {
  I.amOnPage('https://github.com'); // Open the GitHub page
  pause();
  I.see('GitHub'); // Verify that "GitHub" is present on the page
});