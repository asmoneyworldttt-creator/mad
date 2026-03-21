const fs = require('fs');
const path = require('path');

const filePath = path.join('d:\\live p\\medpro\\src\\components\\views\\PatientOverview.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace input width classes inside lists
// `className="w-8 px-1` to `className="w-11 px-1`
content = content.replace(/className="w-8 px-1/g, 'className="w-11 p-1');
content = content.replace(/className="w-10 px-1/g, 'className="w-11 p-1');

// Also fix select cuts on mobile bounds
content = content.replace(/className="px-2 py-0\.5 bg-white dark:bg-slate-800/g, 'className="flex-1 min-w-[120px] px-2 py-1 bg-white dark:bg-slate-800');

fs.writeFileSync(filePath, content);
console.log("Success");
