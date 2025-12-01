const fs = require('fs');
const path = require('path');

class VersionPlugin {
  constructor(options = {}) {
    this.outputFile = options.outputFile || 'version';
  }

  apply(compiler) {
    const projectRoot = path.resolve(__dirname, '..');
    const outputPath = path.join(projectRoot, this.outputFile);

    const commit = process.env.GIT_COMMIT;

    if (!commit) {
      console.log('⚠ GIT_COMMIT not provided – keeping existing version file if present');

      if (fs.existsSync(outputPath)) {
        console.log(`ℹ Existing version file:\n${fs.readFileSync(outputPath, 'utf8')}`);
      } else {
        console.log(`⚠ No version file found at ${outputPath}`);
      }
      return;
    }

    fs.writeFileSync(outputPath, commit);
    console.log(`✔ VersionPlugin wrote version file: ${outputPath} = ${commit}`);
  }
}

module.exports = VersionPlugin;
