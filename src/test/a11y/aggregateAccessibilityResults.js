const fs = require('fs');
const path = require('path');
const htmlFilesDir = 'functional-output/accessibility';
const outputFile = 'functional-output/accessibility/all_results.html';


function aggregateAccessibilityResults() {



    const regexPattern = /manage-user-a11y-audit\.html$/;


    findAndModifyHTML(regexPattern, 'AXE Accessibility Results - Manage User');
















    fs.readdir(htmlFilesDir, (err, files) => {
        if (err) {
            console.error('Error reading from accessibility results directory - ', err);
            return;
        }

        const filteredFiles = files.filter(file => file.endsWith('-a11y-audit.html'));

        let htmlContent = '';
        filteredFiles.forEach(file => {
            const filePath = path.join(htmlFilesDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            htmlContent += content;
        });

        fs.writeFile(outputFile, htmlContent, (err) => {
            if (err) {
                console.error('Error writing output file - ', err);
                return;
            }
            console.log('Accessibility results aggregated successfully');
        });
    });
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

aggregateAccessibilityResults();
