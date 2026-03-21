const fs = require('fs');
const path = require('path');

const filePath = path.join('d:\\live p\\medpro\\src\\components\\views\\PatientOverview.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split(/\r?\n/);

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// Auto parser supporting multiples processed only on comma/newline')) {
        startIdx = i;
        break;
    }
}

if (startIdx === -1) {
    console.log("Could not find start lines using phrase");
    process.exit(1);
}

// Find footer
for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].includes('setAdvisedTreatments(updatedAdvised)') && lines[i+1] && lines[i+1].includes('setTreatmentsDone')) {
        endIdx = i + 2; 
        break;
    }
}

if (endIdx === -1) {
    console.log("Could not find end lines using footer");
    process.exit(1);
}

console.log("Found parser: lines ", startIdx, "to", endIdx);

const newParserLines = `                                            // Auto parser supporting multiples processed only on comma/newline (delimiter)
                                            const fragments = val.split(/[\\,\\n]+/).map(f => f.trim());
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
                                            }`.split('\n');

lines.splice(startIdx, endIdx - startIdx + 1, ...newParserLines);

fs.writeFileSync(filePath, lines.join('\n'));
console.log("Success");
