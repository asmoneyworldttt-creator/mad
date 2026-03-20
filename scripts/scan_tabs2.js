import fs from 'fs';

const content = fs.readFileSync('d:\\live p\\medpro\\src\\components\\views\\PatientOverview.tsx', 'utf-8');

const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.includes('onClick={() => setActiveTab(') || line.includes('activeTab === \'home\'') || line.includes('const tabs = [')) {
        console.log(`${index + 1}: ${line.trim()}`);
    }
});
