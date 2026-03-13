const fs = require('fs');
const path = require('path');

function replaceFileContent(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remove harsh solid whites and slates
    const replaces = [
        [/bg-slate-50\b|bg-white(?!\/)/g, 'bg-[#0F171A]/50 border border-white/5 backdrop-blur-md shadow-neon'],
        [/\btext-slate-[678]00\b/g, 'text-slate-300'],
        [/\btext-slate-900\b|\btext-black\b/g, 'text-white'],
        [/\bborder-slate-[12]00\b/g, 'border-white/5'],
        [/hover:bg-slate-50\b/g, 'hover:bg-white/5'],
        [/\bshadow-sm\b/g, 'shadow-glass']
    ];

    replaces.forEach(([regex, replacement]) => {
        if(regex.test(content)) {
            content = content.replace(regex, replacement);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

function walkDir(dir) {
    let files = fs.readdirSync(dir);
    for (let f of files) {
        let fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
            replaceFileContent(fullPath);
        }
    }
}

walkDir(path.join(__dirname, 'src', 'components'));
console.log('Successfully completed rapid styling repair globally!');
