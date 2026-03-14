const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('src_lint_ansi.json', 'utf8'));
for (const file of data) {
    const unusedVars = file.messages.filter(m => m.ruleId === '@typescript-eslint/no-unused-vars');
    const unusedDeps = file.messages.filter(m => /deprecated/i.test(m.message));
    if (unusedVars.length > 0) {
        console.log(`\nFile: ${file.filePath}`);
        for (const msg of unusedVars) {
            console.log(`  Line ${msg.line}: ${msg.message}`);
        }
    }
    if (unusedDeps.length > 0) {
        console.log(`\nDEPRECATED File: ${file.filePath}`);
        for (const msg of unusedDeps) {
            console.log(`  Line ${msg.line}: ${msg.message}`);
        }
    }
}
