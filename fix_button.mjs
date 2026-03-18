import fs from 'fs';

const path = 'd:\\live p\\medpro\\src\\components\\views\\LabWork.tsx';
let content = fs.readFileSync(path, 'utf-8');

const regex = /<button onClick=\{\(\) => handleDownloadPDF\(o\)\}[^>]+><Download size=\{14\} \/><\/button>/;

const insert = `<button onClick={() => handleDownloadPDF(o)} className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-primary transition-all"><Download size={14} /></button>\n                                                                         <button onClick={() => handleDownloadPDF(o, 'share')} className="p-1.5 rounded-lg border border-violet-200 dark:border-violet-500/10 hover:bg-violet-50 dark:hover:bg-violet-900/10 text-violet-500 hover:text-violet-600 transition-all"><Share2 size={14} /></button>`;

if (regex.test(content)) {
    content = content.replace(regex, insert);
    fs.writeFileSync(path, content, 'utf-8');
    console.log('Button appended successfully!');
} else {
    console.log('Regex did not match exact source text!');
    const slice = content.indexOf('handleDownloadPDF(o)');
    console.log(content.slice(slice - 50, slice + 200));
}
