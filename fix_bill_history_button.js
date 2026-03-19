const fs = require('fs');
const path = 'd:\\live p\\medpro\\src\\components\\views\\QuickBills.tsx';
let content = fs.readFileSync(path, 'utf8');

// Match the exact button inside QuickBills
if (content.includes('<Download size={18} />')) {
   content = content.replace(/<button onClick=\{\(\) => handleDownloadInvoice\(b\)\}[\s\S]*?<Download size=\{18\} \/>\s*<\/button>/, 
   `<div className="flex items-center gap-2">
                                             <button onClick={() => handleDownloadInvoice(b)} title="Download Invoice" className="p-2 rounded-xl border transition-all hover:scale-105 shadow-sm" style={{ background: 'var(--primary-soft)', borderColor: 'var(--border-color)', color: 'var(--primary)' }}>
                                                 <Download size={16} />
                                             </button>
                                             {b.notes?.includes('[Certificate]: true') && (
                                                 <button onClick={() => handleDownloadCertificateFromHistory(b)} title="Download Certificate" className="p-2 rounded-xl border transition-all hover:scale-105 shadow-sm bg-emerald-500/10 border-emerald-500/20 text-emerald-600">
                                                     <FileText size={16} />
                                                 </button>
                                             )}
                                         </div>`);
   fs.writeFileSync(path, content, 'utf8');
   console.log('Success');
} else {
   console.log('Not found');
}
