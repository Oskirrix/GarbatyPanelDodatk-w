const fs = require('fs');
const JavaScriptObfuscator = require('javascript-obfuscator');

const file = 'Garbaty Panel.user.js';
const versionFile = 'loader-version.json';
const nextVersion = '6.10.5';

let source = fs.readFileSync(file, 'utf8');
const marker = '// ==/UserScript==';
const markerIndex = source.indexOf(marker);
if (markerIndex === -1) throw new Error('Userscript header not found');

let header = source.slice(0, markerIndex + marker.length);
let body = source.slice(markerIndex + marker.length).replace(/^\s+/, '');

header = header.replace(/(^\/\/\s*@version\s+).+$/m, `$1${nextVersion}`);
body = body.replaceAll("'6.10.4'", `'${nextVersion}'`);
body = body.replaceAll('"6.10.4"', `"${nextVersion}"`);

const wrappedBody = `(function(){\n${body}\n})();`;

const obfuscated = JavaScriptObfuscator.obfuscate(wrappedBody, {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: true,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 7,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayThreshold: 1,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
}).getObfuscatedCode();

fs.writeFileSync(file, `${header}\n\n${obfuscated}\n`, 'utf8');

const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
versionData.requiredVersion = nextVersion;
fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2) + '\n', 'utf8');

console.log(`Re-obfuscated loader ${nextVersion}`);
