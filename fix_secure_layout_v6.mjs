import fs from 'fs';

const path = 'd:\\live p\\medpro\\src\\components\\views\\LabWork.tsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. Absolute top replace
const topMarker = '<div className="overflow-x-auto">\n                    <table className="w-full text-left border-collapse">';
const topReplace = `<div className="p-6 space-y-4">
                    {isLoading ? (
                        <SkeletonList rows={5} />
                    ) : groupedOrders.map`;

if (content.includes(topMarker)) {
    content = content.replace(topMarker, topReplace);
    
    // 2. We must ALSO strip the nested upper <tbody> <tr> <td /> </tr> </tbody> layout conditions inside standard isloading loop branches.
    // To make this foolproof without regex breaking anything, lets replace first standard isloaded node branches:
    const skeletonRegex = /<thead>[\s\S]*?<\/thead>\s*<tbody style=\{\{ borderColor: 'var\(--border-color\)' \}\}>\s*\{isLoading \? \(\s*<tr>\s*<td colSpan=\{6\}[^>]*?>\s*<SkeletonList rows=\{5\} \/>\s*<\/td>\s*<\/tr>\s*\) : groupedOrders\.map/;
    content = content.replace(skeletonRegex, 'groupedOrders.map');

    const bIndex = content.indexOf('{orders.length === 0');
    if (bIndex !== -1) {
         const backSlice = content.lastIndexOf('</tbody>', bIndex);
         const subContent = content.slice(backSlice, bIndex);
         if (subContent.includes('</table>')) {
              content = content.slice(0, backSlice) + '</div>\n                    ' + content.slice(bIndex);
              fs.writeFileSync(path, content, 'utf-8');
              console.log('Outer layout flattened successfully with combined strict replacements!');
         } else {
              console.log('Unable to locate outer static index bottom tag closure!');
         }
    } else {
         console.log('Index for orders.length match failed!');
    }
} else {
    console.log('Top static marker not found!');
}
