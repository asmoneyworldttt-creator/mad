import fs from 'fs';
const content = fs.readFileSync('d:\\live p\\medpro\\src\\components\\views\\Settings.tsx', 'utf-8');
const lines = content.split('\n');
let output = '';
lines.forEach((line, i) => {
    if (line.includes('setStaffForm')) {
        output += `${i + 1}: ${line.trim()}\n`;
    }
});
fs.writeFileSync('d:\\live p\\medpro\\find_set_staff_output.txt', output);
console.log('Done');
