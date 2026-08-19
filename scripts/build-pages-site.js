const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ROOT_FILES = ['index.html', 'launcher.css', 'v2.html', 'v2.css'];
const ASSET_FILES = [
  'assets/v2/map-layout-data.js',
  'assets/v2/road-collision-data.js',
  'assets/v2/road-collision-past-data.js'
];
const ASSET_DIRECTORIES = [
  'assets/v2/day-runtime-tiles',
  'assets/v2/landmarks',
  'assets/v2/past-enemies',
  'assets/v2/past-evening-runtime-tiles',
  'assets/v2/past-events',
  'assets/v2/past-landmarks',
  'assets/v2/past-protagonist',
  'assets/v2/past-scenes',
  'assets/v2/protagonist'
];
const FORBIDDEN_ASSET_NAME = /(?:source|transparent)/i;

function copyFile(relativePath, outputDirectory) {
  const source = path.join(ROOT, relativePath);
  const destination = path.join(outputDirectory, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyRuntimeDirectory(relativeDirectory, outputDirectory) {
  const sourceDirectory = path.join(ROOT, relativeDirectory);
  for (const entry of fs.readdirSync(sourceDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || FORBIDDEN_ASSET_NAME.test(entry.name)) continue;
    copyFile(path.join(relativeDirectory, entry.name), outputDirectory);
  }
}

function buildPagesSite(outputPath) {
  const outputDirectory = path.resolve(outputPath);
  if (fs.existsSync(outputDirectory)) throw new Error(`Output directory already exists: ${outputDirectory}`);
  fs.mkdirSync(outputDirectory, { recursive: true });

  for (const file of ROOT_FILES) copyFile(file, outputDirectory);
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (entry.isFile() && /^v2.*\.js$/.test(entry.name) && !entry.name.endsWith('.example.js')) {
      copyFile(entry.name, outputDirectory);
    }
  }
  for (const file of ASSET_FILES) copyFile(file, outputDirectory);
  for (const directory of ASSET_DIRECTORIES) copyRuntimeDirectory(directory, outputDirectory);
  fs.writeFileSync(path.join(outputDirectory, '.nojekyll'), '');
}

if (require.main === module) buildPagesSite(process.argv[2] || '.pages-site');

module.exports = { buildPagesSite };
