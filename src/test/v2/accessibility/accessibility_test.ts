const fs = require('fs');
const path = require('path');

Feature('v2_accessibility_tests');

Before(async ({ setupDAO, login }) => {
  await setupDAO.setupAdmin();
  login('admin');
});

Scenario('I am on manage user page',  async ({ I }) => {
  const testUser = await I.haveUser();
  await I.navigateToManageUser(testUser.email);




  // I.runA11yCheck({  detailedReportOptions: { html: true, projectKey: '12389' } });
  // I.runA11yCheck({ reportFileName: 'chand123.html' });


  I.runA11yCheck({ reportFileName: 'manage-user.html' });
  I.checkA11y();

  const regexPattern = /manage-user\.html$/;


  findAndModifyHTML(regexPattern, 'New Heading Test');


});

// Scenario('I am on search user page',  async ({ I }) => {
//   await I.navigateToSearchUser();

//   I.runA11yCheck();
//   I.checkA11y();
// });

// Scenario('I am on edit user page',  async ({ I }) => {
//   const testUser = await I.haveUser();
//   await I.navigateToEditUser(testUser.email);

//   I.runA11yCheck();
//   I.checkA11y();
// });

// Scenario('I am on generate user report page',  async ({ I }) => {
//   await I.navigateToGenerateReport();

//   I.runA11yCheck();
//   I.checkA11y();
// });

// Scenario('I am on add a new user page',  async ({ I }) => {
//   await I.navigateToRegisterUser();

//   I.runA11yCheck();
//   I.checkA11y();
// });


function findAndModifyHTML(regexPattern, newHeading) {
  const directory = 'functional-output/accessibility';

  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error('Error reading directory amend heading:', err);
      return;
    }

    const filenamePattern = new RegExp(regexPattern);

    files.forEach(filename => {
      if (filenamePattern.test(filename)) {

        console.log(`I am here 1111111.........`);
        const filePath = path.join(directory, filename);
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            console.error(`Error reading file change heading ${filename}:`, err);
            return;
          }

          console.log(`I am here 222222222.........`);

          const modifiedContent = data.replace(/<h3>.*?<\/h3>/s, `<h3>${newHeading}</h3>`);

          console.log(`I am here 3333333333.........`);

          fs.writeFile(filePath, modifiedContent, 'utf8', err => {

            console.log(`I am here 444444444.........`);
            if (err) {
              console.error(`Error writing to file ${filename}:`, err);
              return;
            }
            console.log(`Modified heading in ${filename}`);
          });
        });
      }
    });
  });
}
