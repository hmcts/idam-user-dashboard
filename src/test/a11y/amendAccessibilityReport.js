const fs = require('fs');
const path = require('path');
const directory = 'functional-output/accessibility';
const regexPattern = /.*-a11y-audit(?=\.)/;

function amendAccessibilityReport() {
  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error('Error reading accessibility results directory - ', err);
      process.exit(1);
    }

    const filenamePattern = new RegExp(regexPattern);
    let auditFileFound = false;

    files.forEach(filename => {
      if (filenamePattern.test(filename)) {
        auditFileFound = true;
        const filePath = path.join(directory, filename);

        const fileContent = fs.readFile(filePath, 'utf-8');

        const updatedContent = fileContent.replace(/<h3>(.*?)<\/h3>/g, `<h3>${newHeading}</h3>`);

        fs.writeFile(filePath, updatedContent, 'utf-8');

      }
    });

    if (auditFileFound) {
      console.error('Accessibility audit file(s) found, breaking the pipeline.');
      process.exit(1);
    } else {
      console.log('No accessibility audit files found.');
    }
  });
}

amendAccessibilityReport();