const fs = require('fs');
const path = require('path');
const directory = 'functional-output/accessibility';
const regexPattern = /.*-a11y-audit(?=\.)/;


function amendAccessibilityReport() {

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

          const filenameRegex = /^.*?_(.*?)-a11y-audit.html$/;
          const match = filenameRegex.exec(filename);
          const extractedString = match[1];
          const convertedString = extractedString.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

          const modifiedContent = data.replace(/<h3>.*?<\/h3>/s, `<h3>${convertedString} Page - Accessibility Results</h3>`);

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
