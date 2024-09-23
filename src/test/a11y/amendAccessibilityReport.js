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

    console.log('iam here - 00000000-----');

    files.forEach(filename => {
      if (filenamePattern.test(filename)) {
        auditFileFound = true;
        const filePath = path.join(directory, filename);
        console.log('filePath-11111111-----'+filePath);
        console.log('auditFileFound-2222222-----'+auditFileFound);
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            console.error(`Error reading accessibility results file ${filename} - `, err);
            return;
          }

          console.log('33333333-----');

          const filenameRegex = /^.*?_(.*?)-a11y-audit.html$/;
          const match = filenameRegex.exec(filename);
          const extractedString = match[1];
          const convertedString = extractedString.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          console.log('4444444-----'+convertedString);

          const modifiedContent = data.replace(
            /<h3>.*?<\/h3>/s,
            `<h3>${convertedString} Page - Accessibility Results</h3>`
          );

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

    // files.forEach(filename => {
    //   if (filenamePattern.test(filename)) {
    //     auditFileFound = true;

    //     const filePath = path.join(directory, filename);
    //     console.log('filePath - 6666-----'+filePath);
    //     console.log('filename - 7777-----'+filename);
    //     fs.readFile(filePath, 'utf8', (err, data) => {
    //       if (err) {
    //         console.error(`Error reading accessibility results file ${filename} - `, err);
    //         process.exit(1);
    //       }

    //       const filenameRegex = /^.*?_(.*?)-a11y-audit.html$/;
    //       const match = filenameRegex.exec(filename);
    //       console.log('match - 88888-----'+match);
    //       //if (match) {
    //         const extractedString = match[1];
    //         const convertedString = extractedString.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    //         console.log('convertedString - 1111-----'+convertedString);

    //         const modifiedContent = data.replace(/<h3>.*?<\/h3>/s, `<h3>${convertedString} Page - Accessibility Results</h3>`);
    //         console.log('modifiedContent - 22222-----'+modifiedContent);

    //         console.log(`filename is 3333333---- ${filename}`);

    //         fs.writeFile(filePath, modifiedContent, 'utf8', err => {
    //           if (err) {
    //             console.error(`Error writing to file ${filename}:`, err);
    //             process.exit(1);
    //           }
    //           console.log(`Modified heading in ${filename}`);
    //         });
    //       //}
    //     });
    //   }
    // });


    if (auditFileFound) {
      console.error('Accessibility audit file(s) found, breaking the pipeline.');
      process.exit(1);
    } else {
      console.log('No accessibility audit files found.');
    }
  });
}

amendAccessibilityReport();



// function amendAccessibilityReport() {
//   fs.readdir(directory, (err, files) => {
//     if (err) {
//       console.error('Error reading accessibility results directory - ', err);
//       return;
//     }

//     const filenamePattern = new RegExp(regexPattern);

//     files.forEach(filename => {
//       if (filenamePattern.test(filename)) {
//         const filePath = path.join(directory, filename);
//         fs.readFile(filePath, 'utf8', (err, data) => {
//           if (err) {
//             console.error(`Error reading accessibility results file ${filename} - `, err);
//             return;
//           }

//           const filenameRegex = /^.*?_(.*?)-a11y-audit.html$/;
//           const match = filenameRegex.exec(filename);
//           const extractedString = match[1];
//           const convertedString = extractedString.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

//           const modifiedContent = data.replace(
//             /<h3>.*?<\/h3>/s,
//             `<h3>${convertedString} Page - Accessibility Results</h3>`
//           );

//           fs.writeFile(filePath, modifiedContent, 'utf8', err => {
//             if (err) {
//               console.error(`Error writing to file ${filename}:`, err);
//               return;
//             }
//             console.log(`Modified heading in ${filename}`);
//           });
//         });
//       }
//     });
//   });
// }
