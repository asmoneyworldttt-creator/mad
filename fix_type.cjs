const fs = require('fs');
const path = require('path');

const filePath = path.join('d:\\live p\\medpro\\src\\components\\views\\PatientOverview.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace exact string string
content = content.replace('const validItems = [];', 'const validItems: { code: string, tooth: string }[] = [];');

fs.writeFileSync(filePath, content);
console.log("Success");
