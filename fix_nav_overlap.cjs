const fs = require('fs');
const path = require('path');

const filePath = path.join('d:\\live p\\medpro\\src\\components\\MobileBottomNav.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix Center Action Label Tracking which triggers overlapping compression visually
content = content.replace('uppercase tracking-tighter">New Patient</span>', 'uppercase font-extrabold tracking-wide text-[7px]">New Patient</span>');

fs.writeFileSync(filePath, content);
console.log("Success");
