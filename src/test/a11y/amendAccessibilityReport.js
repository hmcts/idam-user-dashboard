const fs = require('fs');
const path = require('path');


function amendAccessibilityReport() {
    amendHeading( /manage-user-a11y-audit\.html$/, 'AXE Accessibility Results - Manage User Page');
    amendHeading(/search-user-a11y-audit\.html$/, 'AXE Accessibility Results - Search User Page');
    amendHeading(/edit-user-a11y-audit\.html$/, 'AXE Accessibility Results - Edit User Page');
    amendHeading(/generate-user-report-a11y-audit\.html$/, 'AXE Accessibility Results - Generate User Report Page');
    amendHeading(/add-new-user-a11y-audit\.html$/, 'AXE Accessibility Results - Add New User Page');
}


function amendHeading(regexPattern, newHeading) {
    const directory = 'functional-output/accessibility';
  
    fs.readdir(directory, (err, files) => {
      if (err) {
        console.error('Error reading accessibility results directory - ', err);
        return;
      }
  
      const filenamePattern = new RegExp(regexPattern);
  
      files.forEach(filename => {
        if (filenamePattern.test(filename)) {
          const filePath = path.join(directory, filename);
          fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
              console.error(`Error reading accessibility results file ${filename} - `, err);
              return;
            }
  
            const modifiedContent = data.replace(/<h3>.*?<\/h3>/s, `<h3>${newHeading}</h3>`);
  
            fs.writeFile(filePath, modifiedContent, 'utf8', err => {
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
