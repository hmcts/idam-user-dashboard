const fs = require('fs');
const path = require('path');
const htmlFilesDir = 'functional-output/accessibility';
const outputFile = 'functional-output/accessibility/accessibility_results.html';


function aggregateHTML() {

    fs.readdir(htmlFilesDir, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
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
                console.error('Error writing output file:', err);
                return;
            }
            console.log('HTML files aggregated successfully');
        });
    });
}

aggregateHTML();
