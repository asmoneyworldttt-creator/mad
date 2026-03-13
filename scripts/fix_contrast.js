const fs = require('fs');
const path = require('path');

function replaceFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix Input readability deeply on dark bg
    content = content.replace(/outline-none/g, 'outline-none text-slate-300'); // make sure inputs text isn't black
    
    // Fix specific background overwrites we might have caused:
    content = content.replace(/bg-white\/5 backdrop-blur-md/g, 'bg-white/5 border border-white/5 backdrop-blur-md text-white/90');
    
    // Some buttons turned invisible or bad
    content = content.replace(/text-slate-300\\b/g, 'text-white/80');
    
    // Better list items
    content = content.replace(/hover:bg-white\/5/g, 'hover:bg-primary/20');
    content = content.replace(/bg-white\/10 backdrop-blur-md/g, 'glass-morphism');
    
    // Reset inputs explicitly
    content = content.replace(/bg-black\/20/g, 'bg-[#0F171A]/80 border border-white/5 focus:border-primary/50 text-white/90 focus:bg-[#0F171A]');
    
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

walkDir(path.join(__dirname, 'src', 'components', 'views'));
console.log('Successfully adjusted contrast globally!');
