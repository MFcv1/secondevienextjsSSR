const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'pageUI') {
      getFiles(path.join(dir, file), fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const allMdList = getFiles(__dirname + '/..');

let output = '';
for (const file of allMdList) {
  // Only process if it's in root or _DOCS or docs
  const relPath = path.relative(__dirname + '/..', file);
  if (!relPath.startsWith('_DOCS') && !relPath.startsWith('docs') && relPath.includes(path.sep)) continue;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').filter(l => l.trim() !== '');
  const summary = lines.slice(0, 15).join('\n'); // take first 15 lines for better context
  output += `\n--- File: ${relPath} ---\n${summary}\n`;
}

fs.writeFileSync(__dirname + '/md_summary.txt', output);
console.log('Summaries written to scripts/md_summary.txt');
