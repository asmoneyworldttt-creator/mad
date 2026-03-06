const fs = require('fs');
const path = require('path');

function replaceFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Background colors replacement to glassmorphism
    // For specific bright backgrounds that stand out:
    content = content.replace(/\bbg-white\b/g, 'bg-white/5 backdrop-blur-md');
    content = content.replace(/\bbg-slate-50\b/g, 'bg-white/5 backdrop-blur-md');
    content = content.replace(/\bbg-slate-100\b/g, 'bg-white/10 backdrop-blur-md');
    
    // Fix text coloring on dark backgrounds
    content = content.replace(/\btext-slate-600\b/g, 'text-slate-300');
    content = content.replace(/\btext-slate-700\b/g, 'text-slate-200');
    content = content.replace(/\btext-slate-800\b/g, 'text-white');
    content = content.replace(/\btext-slate-900\b/g, 'text-white');
    content = content.replace(/\btext-black\b/g, 'text-white');
    content = content.replace(/\btext-gray-900\b/g, 'text-white');
    
    // Fix borders
    content = content.replace(/\bborder-slate-100\b/g, 'border-white/5');
    content = content.replace(/\bborder-slate-200\b/g, 'border-white/10');
    content = content.replace(/\bborder-slate-300\b/g, 'border-white/10');
    content = content.replace(/\bborder-gray-200\b/g, 'border-white/10');

    // Make inputs look good
    content = content.replace(/bg-gray-50/g, 'bg-black/20');
    
    fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
    let files = fs.readdirSync(dir);
    for (let f of files) {
        let fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
            replaceFile(fullPath);
        }
    }
}

walkDir(path.join(__dirname, 'src', 'components'));
console.log('Successfully applied dark glassmorphism theme components globally!');
