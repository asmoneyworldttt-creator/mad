export const treatmentsMaster = [
    { id: 1, category: 'DIAGNOSTIC', name: 'Oral examination', price: 500 },
    { id: 2, category: 'DIAGNOSTIC', name: 'Periodontal charting', price: 300 },
    { id: 3, category: 'DIAGNOSTIC', name: 'Pulp vitality testing', price: 400 },
    { id: 4, category: 'DIAGNOSTIC', name: 'Intraoral periapical radiograph (IOPA)', price: 300 },
    { id: 5, category: 'DIAGNOSTIC', name: 'Bitewing radiograph', price: 300 },
    { id: 6, category: 'DIAGNOSTIC', name: 'Occlusal radiograph', price: 500 },
    { id: 7, category: 'DIAGNOSTIC', name: 'Orthopantomogram (OPG)', price: 1000 },
    { id: 8, category: 'DIAGNOSTIC', name: 'CBCT', price: 2500 },
    { id: 9, category: 'DIAGNOSTIC', name: 'Study models / intraoral scan', price: 1500 },
    { id: 10, category: 'PREVENTIVE', name: 'Oral prophylaxis (Scaling & polishing)', price: 1500 },
    { id: 11, category: 'PREVENTIVE', name: 'Fluoride therapy', price: 1200 },
    { id: 12, category: 'PREVENTIVE', name: 'Pit & fissure sealants', price: 800 },
    { id: 13, category: 'PREVENTIVE', name: 'Desensitization therapy', price: 1000 },
    { id: 14, category: 'PREVENTIVE', name: 'Oral hygiene instruction', price: 500 },
    { id: 15, category: 'RESTORATIVE', name: 'Composite restoration', price: 2000 },
    { id: 16, category: 'RESTORATIVE', name: 'Glass ionomer restoration', price: 1500 },
    { id: 17, category: 'RESTORATIVE', name: 'Temporary restoration', price: 800 },
    { id: 18, category: 'RESTORATIVE', name: 'Core build-up', price: 2500 },
    { id: 19, category: 'RESTORATIVE', name: 'Post & core', price: 3500 },
    { id: 20, category: 'ENDODONTIC', name: 'Pulpotomy', price: 2500 },
    { id: 21, category: 'ENDODONTIC', name: 'Pulpectomy', price: 3000 },
    { id: 22, category: 'ENDODONTIC', name: 'RCT – Started', price: 1500 },
    { id: 23, category: 'ENDODONTIC', name: 'RCT – Dressing', price: 1000 },
    { id: 24, category: 'ENDODONTIC', name: 'RCT – Completed', price: 2000 },
    { id: 25, category: 'ENDODONTIC', name: 'Retreatment RCT', price: 6000 },
    { id: 26, category: 'ENDODONTIC', name: 'Apexification', price: 4000 },
    { id: 27, category: 'ENDODONTIC', name: 'Apicoectomy', price: 5000 },
    { id: 28, category: 'PERIODONTICS', name: 'Scaling & root planing', price: 4000 },
    { id: 29, category: 'PERIODONTICS', name: 'Gingivectomy', price: 4500 },
    { id: 30, category: 'PERIODONTICS', name: 'Flap surgery', price: 8000 },
    { id: 31, category: 'PERIODONTICS', name: 'Crown lengthening', price: 5000 },
    { id: 32, category: 'PERIODONTICS', name: 'Bone graft / GTR', price: 12000 },
    { id: 33, category: 'SURGICAL', name: 'Simple extraction', price: 1000 },
    { id: 34, category: 'SURGICAL', name: 'Surgical extraction', price: 3500 },
    { id: 35, category: 'SURGICAL', name: 'Impacted tooth removal', price: 5000 },
    { id: 36, category: 'SURGICAL', name: 'Frenectomy', price: 3000 },
    { id: 37, category: 'SURGICAL', name: 'Biopsy', price: 2500 },
    { id: 38, category: 'SURGICAL', name: 'Alveoloplasty', price: 4000 },
    { id: 39, category: 'PROSTHODONTICS', name: 'Crown (PFM / Zirconia / E-max)', price: 6000 },
    { id: 40, category: 'PROSTHODONTICS', name: 'Fixed partial denture (Bridge)', price: 18000 },
    { id: 41, category: 'PROSTHODONTICS', name: 'Removable partial denture', price: 5000 },
    { id: 42, category: 'PROSTHODONTICS', name: 'Complete denture', price: 25000 },
    { id: 43, category: 'PROSTHODONTICS', name: 'Veneers', price: 12000 },
    { id: 44, category: 'PROSTHODONTICS', name: 'Full mouth rehabilitation', price: 150000 },
    { id: 45, category: 'IMPLANTOLOGY', name: 'Implant placement', price: 25000 },
    { id: 46, category: 'IMPLANTOLOGY', name: 'Immediate implant placement', price: 30000 },
    { id: 47, category: 'IMPLANTOLOGY', name: 'Healing abutment placement', price: 2000 },
    { id: 48, category: 'IMPLANTOLOGY', name: 'Implant crown / bridge', price: 15000 },
    { id: 49, category: 'IMPLANTOLOGY', name: 'Sinus lift', price: 20000 },
    { id: 50, category: 'IMPLANTOLOGY', name: 'Ridge augmentation', price: 18000 },
    { id: 51, category: 'ORTHODONTICS', name: 'Removable orthodontic appliance', price: 8000 },
    { id: 52, category: 'ORTHODONTICS', name: 'Fixed orthodontic treatment', price: 40000 },
    { id: 53, category: 'ORTHODONTICS', name: 'Clear aligners', price: 80000 },
    { id: 54, category: 'ORTHODONTICS', name: 'Retainers', price: 5000 },
    { id: 55, category: 'PEDODONTICS', name: 'Space maintainer', price: 4500 },
    { id: 56, category: 'PEDODONTICS', name: 'Stainless steel crown', price: 3500 },
    { id: 57, category: 'PEDODONTICS', name: 'Habit breaking appliance', price: 6500 },
    { id: 58, category: 'PREVENTIVE', name: 'Normal scaling', price: 1200 },
    { id: 59, category: 'PERIODONTICS', name: 'Deep scaling', price: 3000 },
];

export const generateMockPatients = () => {
    const firstNames = ['Aarav', 'Neha', 'Vihaan', 'Ananya', 'Vivaan', 'Diya', 'Arjun', 'Sanya', 'Sai', 'Riya', 'Krishna', 'Isha', 'Ishaan', 'Kavya', 'Shaurya', 'Aanya', 'Atharv', 'Myra', 'Ayaan', 'Sara'];
    const lastNames = ['Sharma', 'Verma', 'Singh', 'Patel', 'Kumar', 'Gupta', 'Rao', 'Reddy', 'Das', 'Jain'];

    const patients = [];

    for (let i = 1; i <= 20; i++) {
        const visits = Math.floor(Math.random() * 8) + 1;
        const history = [];

        let hasScaling = Math.random() > 0.3;
        let scalingCount = 0;

        for (let v = 0; v < visits; v++) {
            const isScalingVisit = hasScaling && Math.random() > 0.5;
            const treatmentId = isScalingVisit ? 10 : Math.floor(Math.random() * 59) + 1; // 10 is Scaling
            const treatment = treatmentsMaster.find(t => t.id === treatmentId);

            if (treatmentId === 10) scalingCount++;

            const date = new Date(Date.now() - Math.floor(Math.random() * 1000) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            history.push({
                id: `TRT-${1000 + i * 10 + v}`,
                date,
                treatment: treatment?.name,
                category: treatment?.category,
                cost: treatment?.price,
                notes: `Procedure completed without complications. Given post-op instructions.`,
                tooth: treatment?.category === 'DIAGNOSTIC' || treatment?.category === 'PREVENTIVE' ? null : Math.floor(Math.random() * 32) + 1
            });
        }

        if (i === 1) {
            history.push({ id: 'TRT-X1', date: '2023-01-15', treatment: 'Oral prophylaxis (Scaling & polishing)', category: 'PREVENTIVE', cost: 1500, notes: 'Calculus removed', tooth: null });
            history.push({ id: 'TRT-X2', date: '2023-07-20', treatment: 'Oral prophylaxis (Scaling & polishing)', category: 'PREVENTIVE', cost: 1500, notes: 'Routine scaling', tooth: null });
            history.push({ id: 'TRT-X3', date: '2024-02-10', treatment: 'Oral prophylaxis (Scaling & polishing)', category: 'PREVENTIVE', cost: 1500, notes: 'Slight gingivitis', tooth: null });
        }
        if (i === 2) {
            history.push({ id: 'TRT-Y1', date: '2024-01-10', treatment: 'RCT – Started', category: 'ENDODONTIC', cost: 1500, notes: 'Access opening done', tooth: 14 });
            history.push({ id: 'TRT-Y2', date: '2024-01-17', treatment: 'RCT – Dressing', category: 'ENDODONTIC', cost: 1000, notes: 'BMP done', tooth: 14 });
            history.push({ id: 'TRT-Y3', date: '2024-01-24', treatment: 'RCT – Completed', category: 'ENDODONTIC', cost: 2000, notes: 'Obturation completed', tooth: 14 });
        }

        history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        patients.push({
            id: `PT-${10000 + i}`,
            name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            age: Math.floor(Math.random() * 60) + 18,
            gender: Math.random() > 0.5 ? 'Male' : 'Female',
            phone: `+91 98${Math.floor(Math.random() * 100000000)}`,
            email: `patient${i}@example.com`,
            bloodGroup: ['A+', 'O+', 'B+', 'AB+', 'O-'][Math.floor(Math.random() * 5)],
            lastVisit: history.length > 0 ? history[0].date : 'N/A',
            totalSpent: history.reduce((sum, h) => sum + (h.cost || 0), 0),
            history
        });
    }
    return patients;
};

export const mockPatients = generateMockPatients();
