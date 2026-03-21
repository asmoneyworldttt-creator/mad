const fs = require('fs');
const path = require('path');

const filePath = path.join('d:\\live p\\medpro\\src\\components\\views\\PatientOverview.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Delete the modal block at lines 2020-2368
// We can find it by looking for `{isSoapModalOpen && (\n *<div className="fixed inset-0`
const modalRegex = /\{isSoapModalOpen\s*&&\s*\(\s*<div className="fixed inset-0[\s\S]*?\}\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\s*\}/;

if (!modalRegex.test(content)) {
    console.log("Could not find the modal block with fixed inset-0 using regex.");
    process.exit(1);
}

// Extract content inside the modal for insertion above
const modalMatch = content.match(modalRegex);
const fullModalBlock = modalMatch[0];

// Extract from the container div inside the modal
const innerDivRegex = /<div className={`p-8 rounded-\[2\.5rem\][\s\S]*?(<div className="space-y-4">[\s\S]*?<\/div>)\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\s*\}/;
// Wait, inner container starting with <div className={`p-8
const innerContainerMatch = fullModalBlock.match(/<div className={`p-8 rounded-\[2.5rem\][\s\S]*?(<div className="space-y-4">[\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\s*\}/);

// Actually, simpler: let's construct the inline block representation:
const inlineFormBlock = `
                                {isSoapModalOpen && (
                                    <div className={\`p-4 sm:p-6 rounded-[2rem] border animate-slide-up space-y-4 mb-4 \${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-slate-50 border-slate-100 shadow-sm'}\`} style={{ border: '1px solid var(--border-color)' }}>
                                        <div className="flex justify-between items-center mb-2 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
                                            <h3 className="font-black text-lg tracking-tight">New Clinical Note</h3>
                                            <button onClick={() => setIsSoapModalOpen(false)} className={\`p-1.5 rounded-xl transition-all \${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'}\`}>×</button>
                                        </div>
` + fullModalBlock.match(/<div className="space-y-4">[\s\S]*?<button onClick={handleSaveNote}[\s\S]*?<\/button>\s*<\/div>/)[0] + `
                                    </div>
                                )}`;

// Upgrade parser logic inside the inlineFormBlock string before replacing
const parserRegex = /(\/\/ Auto parser supporting multiples processed only on comma\/newline[\s\S]*?advised\.forEach\([\s\S]*?\}\);)/;
const newParser = `// Auto parser supporting multiples processed only on comma/newline (delimiter)
                                            const fragments = val.split(/[,\\n]+/).map(f => f.trim());
                                            const isDoneTypingLast = val.endsWith(',') || val.endsWith('\\n');
 
                                            const validItems = [];
                                            let currentShortcut = '';
                                            fragments.forEach((frag, idx) => {
                                                if (idx === fragments.length - 1 && !isDoneTypingLast) return;
                                                const matchFull = frag.match(/^([A-Za-z]+)\\s+(\\d{1,2})$/i);
                                                if (matchFull) {
                                                    currentShortcut = matchFull[1].toUpperCase();
                                                    validItems.push({ code: currentShortcut, tooth: matchFull[2] });
                                                    console.log("Full match:", currentShortcut, matchFull[2]);
                                                } else {
                                                    const matchNum = frag.match(/^(\\d{1,2})$/);
                                                    if (matchNum && currentShortcut) {
                                                        validItems.push({ code: currentShortcut, tooth: matchNum[1] });
                                                        console.log("Num match:", currentShortcut, matchNum[1]);
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

const fixedInlineFormBlock = inlineFormBlock.replace(parserRegex, newParser);

// Replace button above list
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

// Insert after the button
const targetInsertionPoint = btnRegex;

content = content.replace(btnRegex, newButton + "\n" + fixedInlineFormBlock);

// Now delete the old modal from content
content = content.replace(modalRegex, '');

fs.writeFileSync(filePath, content);
console.log("Success");
