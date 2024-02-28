const fs = require('fs');
const path = require('path');
const htmlFilesDir = 'functional-output/accessibility';
const outputFile = 'functional-output/accessibility/all_results.html';


function aggregateAccessibilityResults() {







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




aggregateAccessibilityResults();
