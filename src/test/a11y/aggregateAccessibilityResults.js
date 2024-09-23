const fs = require('fs');
const path = require('path');
const htmlFilesDir = 'functional-output/accessibility';
const outputFile = 'functional-output/accessibility/all_results.html';


function aggregateAccessibilityResults() {
    fs.readdir(htmlFilesDir, (err, files) => {
        if (err) {
            console.error('Error reading from accessibility results directory - ', err);
            process.exit(1);
        }

        const filteredFiles = files.filter(file => file.endsWith('-a11y-audit.html'));

        let htmlContent = '';
        filteredFiles.forEach(file => {
            const filePath = path.join(htmlFilesDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            htmlContent += content;
        });

        if (htmlContent.trim().length !== 0) {
            fs.writeFile(outputFile, htmlContent, err => {
              if (err) {
                console.error('Error writing output file - ', err);
                process.exit(1);
              }
              console.log('Accessibility results aggregated successfully');
            });
          } else {
            const pages = [
              'Manage User Page',
              'Search User Page',
              'Edit User Page',
              'Generate User Report Page',
              'Add New User Page',
            ];
            const htmlpages = `
            <ul>
              ${pages.map(page => `<li>${page}</li>`).join('\n')}
            </ul>`;
            const customMessage = `<h3>No Accessibility issues found in below pages ${htmlpages}</h3>`;
            fs.writeFile(outputFile, customMessage, err => {
              if (err) {
                console.error('Error writing output file - ', err);
                process.exit(1);
              }
              console.log('No Accessibility issues found', outputFile);
            });
          }

    });
}

aggregateAccessibilityResults();