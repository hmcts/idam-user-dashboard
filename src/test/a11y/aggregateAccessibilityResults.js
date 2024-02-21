const fs = require('fs');
const path = require('path');
const htmlFilesDir = 'functional-output/accessibility';
const outputFile = 'functional-output/accessibility/accessibility_results.html';


function aggregateAccessibilityResults() {

    fs.readdir(htmlFilesDir, (err, files) => {
        if (err) {
            console.error('Error reading accessibility reports directory:', err);
            return;
        }
        let htmlContent = '';
        files.forEach(file => {
            const filePath = path.join(htmlFilesDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            htmlContent += content;
        });

        fs.writeFile(outputFile, htmlContent, (err) => {
            if (err) {
                console.error('Error writing aggregated accessibility results output file:', err);
                return;
            }
            console.log('Accessibility results aggregated successfully');
        });
    });
}

aggregateAccessibilityResults();
