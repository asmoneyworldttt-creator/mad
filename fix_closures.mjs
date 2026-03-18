import fs from 'fs';

const path = 'd:\\live p\\medpro\\src\\components\\views\\LabWork.tsx';
let content = fs.readFileSync(path, 'utf-8');

const tIndex = content.indexOf('{orders.length === 0');
const bClose = content.lastIndexOf('</div>', tIndex);

if (tIndex !== -1 && bClose !== -1) {
    const sliceBefore = content.slice(0, bClose);
    const sliceAfter = content.slice(bClose + 6); 

    content = sliceBefore + sliceAfter;

    // Replace the redundant triple closures at the very end
    const bottomRegex = /<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/;
    if (bottomRegex.test(content)) {
        content = content.replace(bottomRegex, '</div>\n\t\t\t</div>\n\t);\n}');
        fs.writeFileSync(path, content, 'utf-8');
        console.log('Trailing closures fixed perfectly with index slice edits!');
    } else {
        console.log('Bottom closures regex did not match target sequence!');
        // Print the bottom 100 characters to inspect formatting triggers
        console.log(content.slice(-100));
    }
} else {
    console.log('Indices for orders.length or closure div not found!');
}
