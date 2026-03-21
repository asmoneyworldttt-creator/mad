const fs = require('fs');
const path = require('path');

const filePath = path.join('d:\\live p\\medpro\\src\\components\\views\\PatientOverview.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix Patient Status Badge wrapping at line 803 (or lifecycle color text-sm font-bold)
content = content.replace(/className={`\${patientLifecycle\.color}\s*text-sm\s*font-bold/, "className={`\${patientLifecycle.color} text-sm font-bold whitespace-nowrap");

// 2. Fix Advised Treatment status wrapping
content = content.replace(/className={`px-1\.5\s*py-0\.5\s*rounded\s*text-\[8px\]\s*uppercase\s*tracking-wider/g, "className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider whitespace-nowrap");

fs.writeFileSync(filePath, content);
console.log("Success");
