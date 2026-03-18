import fs from 'fs';

const path = 'd:\\live p\\medpro\\src\\components\\views\\LabWork.tsx';
let content = fs.readFileSync(path, 'utf-8');

const headerRegex = /<div className="overflow-x-auto">\s*<table[^>]*?>\s*<thead>[\s\S]*?<\/thead>\s*<tbody[^>]*?>\s*\{isLoading \? \(\s*<tr>\s*<td[^>]*?>\s*<SkeletonList[^>]*?>\s*<\/td>\s*<\/tr>\s*\) : groupedOrders\.map/;

const headerInsert = `<div className="p-6 space-y-4">\n                    {isLoading ? (\n                        <SkeletonList rows={5} />\n                    ) : groupedOrders.map`;

if (headerRegex.test(content)) {
    content = content.replace(headerRegex, headerInsert);
    content = content.replace(/<\/tbody>\s*<\/table>\s*\{orders\.length === 0/, '</div>\n                    {orders.length === 0');
    
    // Also, update the card to have rounded-2xl and full width styles for visual balance instead of standard dividers
    content = content.replace(/<div key=\{group\.patientId\} className="border-b" style=\{\{ borderColor: 'var\(--border-color\)' \}\}>/, '<div key={group.patientId} className="border rounded-2xl p-2 mb-4 shadow-sm" style={{ borderColor: \'var(--border-color)\', background: \'var(--card-bg-alt)\' }}>');
    
    fs.writeFileSync(path, content, 'utf-8');
    console.log('Layout updated to flat divs successfully!');
} else {
    console.log('Regex header match failed!');
}
