const fs = require('fs');
const path = require('path');

const filePath = path.join('d:\\live p\\medpro\\src\\components\\views\\QuickBills.tsx');
if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Change sm: to md: for responsive grids to stack on mobile/medium frames fully
    content = content.replace(/grid grid-cols-1 sm:grid-cols-2 gap-4/g, 'grid grid-cols-1 md:grid-cols-2 gap-4');
    content = content.replace(/grid grid-cols-1 sm:grid-cols-3 gap-4/g, 'grid grid-cols-1 md:grid-cols-3 gap-4');
    
    fs.writeFileSync(filePath, content);
    console.log("Updated QuickBills.tsx");
}

console.log("Success");
