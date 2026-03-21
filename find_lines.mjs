import fs from 'fs';
const file = 'd:/live p/medpro/src/components/views/PatientOverview.tsx';
const content = fs.readFileSync(file, 'utf-8');
const lines = content.split('\n');
lines.forEach((l, i) => {
    if (l.includes('isSoapModalOpen') || l.includes('newNote.objective') || l.includes('advisedTreatments')) {
        console.log(`${i+1}: ${l}`);
    }
});
