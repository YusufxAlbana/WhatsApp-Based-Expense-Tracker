const fs = require('fs');
const os = require('os');
const path = require('path');
const src = path.join(os.homedir(), '.gemini', 'antigravity', 'brain', 'a900a8c9-a02c-4478-b576-ec58bc34f7fc', 'weberganize_logo_1776134168575.png');
const dest = path.join(__dirname, 'public', 'logo.png');
fs.copyFileSync(src, dest);
console.log('Copied successfully!');
