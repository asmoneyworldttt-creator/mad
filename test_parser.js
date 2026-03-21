const val = "as 15, 14, 18 ,";
const fragments = val.split(/[,\n]+/).map(f => f.trim());
const isDoneTypingLast = val.endsWith(',') || val.endsWith('\n');

const validItems = [];
let currentShortcut = '';

console.log("Fragments:", fragments);
console.log("isDoneTypingLast:", isDoneTypingLast);

fragments.forEach((frag, idx) => {
    if (idx === fragments.length - 1 && !isDoneTypingLast) return;
    if (!frag) return; // skip empty
    
    const matchFull = frag.match(/^([A-Za-z]+)\s+(\d{1,2})$/i);
    if (matchFull) {
        currentShortcut = matchFull[1].toUpperCase();
        validItems.push({ code: currentShortcut, tooth: matchFull[2] });
        console.log("Full match:", currentShortcut, matchFull[2]);
    } else {
        const matchNum = frag.match(/^(\d{1,2})$/);
        if (matchNum && currentShortcut) {
            validItems.push({ code: currentShortcut, tooth: matchNum[1] });
            console.log("Num match:", currentShortcut, matchNum[1]);
        } else {
            console.log("No match for:", frag, "currentShortcut:", currentShortcut);
        }
    }
});

console.log("Valid items:", validItems);
