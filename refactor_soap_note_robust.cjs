const fs = require('fs');
const path = require('path');

const filePath = path.join('d:\\live p\\medpro\\src\\components\\views\\PatientOverview.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find lines
const lines = content.split(/\r?\n/);

let modalStartLine = -1;
let modalEndLine = -1;

for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].trim() === '{isSoapModalOpen && (' && lines[i+1].includes('fixed inset-0')) {
        modalStartLine = i;
        break;
    }
}

if (modalStartLine === -1) {
    console.log("Could not find start lines");
    process.exit(1);
}

// Fine the matching end index. Modal usually ends at `                )}`
// Let's count back from the end or just find the first `                )}` inside the appropriate index
for (let i = modalStartLine + 5; i < lines.length; i++) {
   if (lines[i].trim() === ')}' && lines[i-1].includes('</div>') && lines[i-2].includes('</div>')) {
       modalEndLine = i;
       break;
   }
}

if (modalEndLine === -1) {
    console.log("Could not find end lines");
    process.exit(1);
}

console.log("Found modal: lines ", modalStartLine, "to", modalEndLine);

const modalLines = lines.slice(modalStartLine, modalEndLine + 1).join('\n');

// Update parser first in that string snippet
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

const fixedModalLines = modalLines.replace(parserRegex, newParser);

// Get inner structure containing the standard form
const spaceY4Match = fixedModalLines.match(/<div className="space-y-4">[\s\S]*?<button onClick={handleSaveNote}[\s\S]*?<\/button>\s*<\/div>/);
if (!spaceY4Match) {
    console.log("Could not find space-y-4 contents");
    process.exit(1);
}

const inlineFormBlock = `
                                {isSoapModalOpen && (
                                    <div className={\`p-4 sm:p-6 rounded-[2rem] border animate-slide-up space-y-4 mb-4 \${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-slate-50 border-slate-100 shadow-sm'}\`} style={{ border: '1px solid var(--border-color)' }}>
                                        <div className="flex justify-between items-center mb-2 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
                                            <h3 className="font-black text-lg tracking-tight">New Clinical Note</h3>
                                            <button onClick={() => setIsSoapModalOpen(false)} className={\`p-1.5 rounded-xl transition-all \${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'}\`}>×</button>
                                        </div>
` + spaceY4Match[0] + `
                                    </div>
                                )}`;

// Replace button above list
const btnRegex = /<div className="flex justify-end mb-2">[\s\S]*?<\/div>/;
let newButton = `
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

content = content.replace(btnRegex, newButton + "\n" + inlineFormBlock);

// Delete old modal. Splice lines out.
lines.splice(modalStartLine, modalEndLine - modalStartLine + 1);
const finalContent = lines.join('\n');

// Write back
fs.writeFileSync(filePath, finalContent);
console.log("Success");
