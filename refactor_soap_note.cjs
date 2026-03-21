const fs = require('fs');
const path = require('path');

const filePath = path.join('d:\\live p\\medpro\\src\\components\\views\\PatientOverview.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Delete the modal block at lines 2020-2368
const modalRegex = /\{isSoapModalOpen\s*&&\s*\(\s*<div className="fixed inset-0[\s\S]*?\}\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\s*\}/;

if (!modalRegex.test(content)) {
    console.log("Could not find the modal block with fixed inset-0 using regex.");
    process.exit(1);
}

const modalMatch = content.match(modalRegex);
const fullModalBlock = modalMatch[0];

// Upgrade parser logic inside that block FIRST, before extracting any items.
const parserRegex = /(\/\/ Auto parser supporting multiples processed only on comma\/newline[\s\S]*?advised\.forEach\([\s\S]*?\}\);)/;
const newParser = `// Auto parser supporting multiples processed only on comma/newline (delimiter)
                                            const fragments = val.split(/[,\\n]+/).map(f => f.trim());
                                            const isDoneTypingLast = val.endsWith(',') || val.endsWith('\\n');
 
                                            const validItems = [];
                                            let currentShortcut = '';
                                            fragments.forEach((frag, idx) => {
                                                if (idx === fragments.length - 1 && !isDoneTypingLast) return;
                                                // Matches AS 15, RS 16, or updates currentShortcut
                                                const matchFull = frag.match(/^([A-Za-z]+)\\s+(\\d{1,2})$/i);
                                                if (matchFull) {
                                                    currentShortcut = matchFull[1].toUpperCase();
                                                    validItems.push({ code: currentShortcut, tooth: matchFull[2] });
                                                } else {
                                                    const matchNum = frag.match(/^(\\d{1,2})$/);
                                                    if (matchNum && currentShortcut) {
                                                        validItems.push({ code: currentShortcut, tooth: matchNum[1] });
                                                    }
                                                }
                                            });

                                            if (validItems.length > 0) {
                                                const updatedAdvised = [...advisedTreatments];
                                                const updatedDone = [...treatmentsDone];
 
                                                validItems.forEach(it => {
                                                    const existsAdvised = updatedAdvised.some(a => a.tooth === it.tooth && a.code === it.code);
                                                    if (!existsAdvised) updatedAdvised.push({ tooth: it.tooth, code: it.code, treatment: '', status: 'Pending' });
 
                                                    const existsDone = updatedDone.some(d => d.tooth === it.tooth && d.code === it.code);
                                                    if (!existsDone) updatedDone.push({ tooth: it.tooth, code: it.code, treatment: '', status: 'Completed' });
                                                });
 
                                                setAdvisedTreatments(updatedAdvised);
                                                setTreatmentsDone(updatedDone);
                                            }`;

const fixedModalBlock = fullModalBlock.replace(parserRegex, newParser);

// 2. Wrap content inside an inline block
const inlineFormBlock = `
                                {isSoapModalOpen && (
                                    <div className={\`p-4 sm:p-6 rounded-[2rem] border animate-slide-up space-y-4 mb-4 \${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-slate-50 border-slate-100 shadow-sm'}\`} style={{ border: '1px solid var(--border-color)' }}>
                                        <div className="flex justify-between items-center mb-2 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
                                            <h3 className="font-black text-lg tracking-tight">New Clinical Note</h3>
                                            <button onClick={() => setIsSoapModalOpen(false)} className={\`p-1.5 rounded-xl transition-all \${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'}\`}>×</button>
                                        </div>
` + fixedModalBlock.match(/<div className="space-y-4">[\s\S]*?<button onClick={handleSaveNote}[\s\S]*?<\/button>\s*<\/div>/)[0] + `
                                    </div>
                                )}`;

const btnRegex = /<div className="flex justify-end mb-2">[\s\S]*?<\/div>/;
const newButton = `
                                <div className="flex justify-end mb-2">
                                    <button onClick={() => {
                                        if (isSoapModalOpen) {
                                            setIsSoapModalOpen(false);
                                        } else {
                                            setNewNote({ subjective: '', objective: '', assessment: '', plan: '', doctor_name: 'Dr. Sarah Jenkins' });
                                            setAdvisedTreatments([]);
                                            setAdvisedLabOrders([]);
                                            setTreatmentsDone([]);
                                            setIsEditingNote(false);
                                            setEditingNoteId(null);
                                            setIsSoapModalOpen(true);
                                        }
                                    }} className={\`\${isSoapModalOpen ? 'bg-slate-800 text-slate-400' : 'bg-primary text-white'} px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95\`}>
                                        {isSoapModalOpen ? 'Cancel Note' : <><Plus size={14} /> New Clinical Note</>}
                                    </button>
                                </div>`;

const targetInsertionPoint = btnRegex;

content = content.replace(btnRegex, newButton + "\n" + inlineFormBlock);

// Delete the old modal (use `fixedModalBlock`'s regex which is now just `modalRegex` in content since fixedModalBlock is just fixed inside memory!).
// Wait, the content originally in file does NOT have the fixes yet!
// So replacing with `modalRegex` IN THE FILE content will remove the modal block exactly.
content = content.replace(modalRegex, '');

fs.writeFileSync(filePath, content);
console.log("Success");
