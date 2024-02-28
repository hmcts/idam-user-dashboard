const fs = require('fs');
const path = require('path');


function amendAccessibilityReport() {


    findAndModifyHTML( /manage-user-a11y-audit\.html$/, 'AXE Accessibility Results - Manage User');
    findAndModifyHTML(/search-user-a11y-audit\.html$/, 'AXE Accessibility Results - Search User');
    findAndModifyHTML(/edit-user-a11y-audit\.html$/, 'AXE Accessibility Results - Edit User');
    findAndModifyHTML(/generate-user-report-a11y-audit\.html$/, 'AXE Accessibility Results - Generate User Report');
    findAndModifyHTML(/add-new-user-a11y-audit\.html$/, 'AXE Accessibility Results - Add New User');

















}


function findAndModifyHTML(regexPattern, newHeading) {
    const directory = 'functional-output/accessibility';
  
    console.log('I am here 000000000.........');
  
    fs.readdir(directory, (err, files) => {
      if (err) {
        console.error('Error reading directory amend heading:', err);
        return;
      }
  
      const filenamePattern = new RegExp(regexPattern);
  
      files.forEach(filename => {
        if (filenamePattern.test(filename)) {
  
          console.log('I am here 1111111.........');
          const filePath = path.join(directory, filename);
          fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
              console.error(`Error reading file change heading ${filename}:`, err);
              return;
            }
  
            console.log('I am here 222222222.........');
  
            const modifiedContent = data.replace(/<h3>.*?<\/h3>/s, `<h3>${newHeading}</h3>`);
  
            console.log('I am here 3333333333.........');
  
            fs.writeFile(filePath, modifiedContent, 'utf8', err => {
  
              console.log('I am here 444444444.........');
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

  amendAccessibilityReport();
