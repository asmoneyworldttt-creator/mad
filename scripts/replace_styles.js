const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'src', 'components', 'views');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Backgrounds
    content = content.replace(/\bbg-slate-50\/50\b/g, 'bg-white/5');
    content = content.replace(/\bbg-slate-50\b/g, 'bg-white/5');
    content = content.replace(/\bbg-white\b/g, 'bg-white/10');
    content = content.replace(/\bbg-slate-100\b/g, 'bg-white/10');
    
    // Text colors
    content = content.replace(/\btext-slate-600\b/g, 'text-slate-300');
    content = content.replace(/\btext-slate-700\b/g, 'text-slate-200');
    content = content.replace(/\btext-slate-800\b/g, 'text-white');
    content = content.replace(/\btext-slate-900\b/g, 'text-white');
    content = content.replace(/\btext-text-dark\b/g, 'text-white');
    
    // Borders
    content = content.replace(/\bborder-slate-100\b/g, 'border-white/5');
    content = content.replace(/\bborder-slate-200\b/g, 'border-white/10');
    content = content.replace(/\bborder-slate-300\b/g, 'border-white/20');
    
    fs.writeFileSync(filePath, content, 'utf8');
}

const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx'));
files.forEach(f => replaceInFile(path.join(viewsDir, f)));

console.log('Replaced light mode classes in all views!');
