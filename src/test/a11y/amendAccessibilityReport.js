const fs = require('fs');
const path = require('path');


function amendAccessibilityReport() {
    amendHeading(/.*manage-user-a11y-audit(?=\.)/, 'Manage User Page - Accessibility Results');
    amendHeading(/.*search-user-a11y-audit(?=\.)/, 'Search User Page - Accessibility Results');
    amendHeading(/.*edit-user-a11y-audit(?=\.)/, 'Edit User Page - Accessibility Results');
    amendHeading(/.*generate-user-report-a11y-audit(?=\.)/, 'Generate User Report Page - Accessibility Results');
    amendHeading(/.*add-new-user-a11y-audit(?=\.)/, 'Add New User Page - Accessibility Results');
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
