const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace hardcoded "dark theme" values with variables
    const mappings = [
        [/bg-white\/5 backdrop-blur-md/g, 'bg-background-light/30 backdrop-blur-md'],
        [/bg-white\/5/g, 'bg-background-light/30'],
        [/text-slate-400/g, 'text-text-muted'],
        [/text-slate-300/g, 'text-text-main/80'],
        [/text-white\/40/g, 'text-text-muted/40'],
        [/border-white\/5/g, 'border-white/10'],
        [/#135bec/g, 'var(--accent-cyan)'],
        [/bg-\[#0F171A\]/g, 'bg-background'],
        [/text-slate-200/g, 'text-text-main']
    ];

    mappings.forEach(([regex, replacement]) => {
        if (regex.test(content)) {
            content = content.replace(regex, replacement);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

function traverse(dir) {
    const list = fs.readdirSync(dir);
    for (let file of list) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            processFile(fullPath);
        }
    }
}

traverse(path.join(__dirname, 'src', 'components'));
console.log('Final theme migration sweep complete.');
