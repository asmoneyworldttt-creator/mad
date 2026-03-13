const fs = require('fs');

// Helpers for random data
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[random(0, arr.length - 1)];

// Constants
const DENTIST_NAMES = ["Dr. K. Ramesh", "Dr. M. S. Srinivasan", "Dr. S. Karthikeyan", "Dr. P. Vinothkumar", "Dr. A. Meenakshi", "Dr. N. Balamurugan", "Dr. R. Shalini", "Dr. V. Arun", "Dr. C. Gopinath", "Dr. T. Kavitha"];
const SPECIALIZATIONS = ["General Dentist", "General Dentist", "General Dentist", "Endodontist", "Periodontist", "Oral & Maxillofacial Surgeon", "Orthodontist", "Prosthodontist", "Pediatric Dentist", "Implantologist"];

const PATIENT_FIRST = ["Arjun", "Kannan", "Murugan", "Prakash", "Suresh", "Ravi", "Venkatesh", "Manoj", "Dinesh", "Gowtham", "Sathish", "Karthik", "Ranjith", "Deepak", "Ajith", "Priya", "Lakshmi", "Preethi", "Divya", "Swathi", "Kanimozhi", "Anitha", "Ramya", "Sowmya", "Geetha", "Kavya", "Nithya", "Sneha", "Nalini", "Vidhya"];
const PATIENT_LAST = ["Raman", "Natarajan", "Pillai", "Iyer", "Chettiar", "Gounder", "Naidu", "Reddy", "Mudaliar", "Nadar", "Rao", "Srinivasan", "Krishnan", "Varma"];

const CITIES = ["Chennai", "Coimbatore", "Madurai", "Salem", "Trichy", "Tirunelveli", "Vellore", "Erode", "Thoothukudi", "Thanjavur"];

// Master Treatments
const TREATMENTS = [
    { id: 1, name: 'Oral Examination', price: 400, category: 'Diagnostic' }, { id: 2, name: 'Periodontal Charting', price: 500, category: 'Diagnostic' },
    { id: 4, name: 'Intraoral Periapical Radiograph (IOPA)', price: 200, category: 'Diagnostic' }, { id: 7, name: 'Orthopantomogram (OPG)', price: 800, category: 'Diagnostic' },
    { id: 10, name: 'Oral Prophylaxis – Scaling & Polishing', price: 1000, category: 'Preventive' }, { id: 11, name: 'Fluoride Therapy', price: 800, category: 'Preventive' },
    { id: 15, name: 'Composite Restoration', price: 1500, category: 'Restorative' }, { id: 16, name: 'Glass Ionomer Restoration', price: 1200, category: 'Restorative' },
    { id: 22, name: 'RCT – Started', price: 2000, category: 'Endodontic' }, { id: 23, name: 'RCT – Dressing', price: 1000, category: 'Endodontic' }, { id: 24, name: 'RCT – Completed', price: 2000, category: 'Endodontic' },
    { id: 33, name: 'Simple Extraction', price: 1000, category: 'Surgical' }, { id: 34, name: 'Surgical Extraction', price: 3000, category: 'Surgical' },
    { id: 39, name: 'Crown (Zirconia)', price: 8000, category: 'Prosthodontics' }, { id: 40, name: 'Fixed Partial Denture (Bridge)', price: 24000, category: 'Prosthodontics' },
    { id: 45, name: 'Implant Placement', price: 30000, category: 'Implantology' }, { id: 52, name: 'Fixed Orthodontic Treatment (Braces)', price: 45000, category: 'Orthodontics' },
    { id: 56, name: 'Stainless Steel Crown (Primary Teeth)', price: 2500, category: 'Pedodontics' }
];

// Generate past 6 months timestamp
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
const now = new Date();
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const ymd = (d) => d.toISOString().split('T')[0];

let doctorsSQL = ``;
let doctorsList = [];

for (let i = 0; i < 10; i++) {
    const id = `DOC-${100 + i}`;
    doctorsList.push({ id, name: DENTIST_NAMES[i], spec: SPECIALIZATIONS[i] });
    doctorsSQL += `INSERT INTO public.staff (id, name, role, mobile, email, qualifications, is_master) VALUES ('${id}', '${DENTIST_NAMES[i]}', 'Doctor', '9${random(100000000, 999999999)}', 'dr${i}@clinic.com', '${SPECIALIZATIONS[i]}', ${i === 0 ? 'true' : 'false'});\n`;
}

let patientsSQL = ``;
let patientChartJSON = {};
let appointmentsSQL = ``;
let historySQL = ``;
let billsSQL = ``;
let patientsList = [];

for (let i = 0; i < 30; i++) {
    const ptId = `PT-202X${i}`;
    const fname = PATIENT_FIRST[i];
    const lname = randomItem(PATIENT_LAST);
    const age = random(5, 75);
    const isPedo = age < 14;
    const isRegular = random(1, 100) > 60;

    let primaryDoc = isPedo ? doctorsList.find(d => d.spec === 'Pediatric Dentist') : doctorsList[random(0, 3)]; // Assign mostly to general dentists

    // Tooth charting
    let toothChart = {};
    if (random(0, 1)) toothChart["11"] = { condition: "Filled", surfaces: [], note: "Composite done" };
    if (random(0, 1)) toothChart["36"] = { condition: "Decayed", surfaces: ["O"], note: "Deep caries" };
    if (random(0, 1)) toothChart["46"] = { condition: "Missing", surfaces: [], note: "Extracted long back" };
    if (age > 30 && random(0, 1)) toothChart["21"] = { condition: "Crown placed", surfaces: [], note: "PFM Crown" };

    patientChartJSON[ptId] = { tooth_chart: toothChart };
    patientsList.push({ id: ptId, name: `${fname} ${lname}` });

    patientsSQL += `INSERT INTO public.patients (id, name, age, gender, phone, email, blood_group, last_visit, total_spent, address, whatsapp_number) VALUES ('${ptId}', '${fname} ${lname}', ${age}, '${randomItem(['Male', 'Female'])}', '9${random(100000000, 999999999)}', '${fname.toLowerCase()}@example.com', '${randomItem(['O+', 'B+', 'A+'])}', '${ymd(randomDate(sixMonthsAgo, now))}', 0, '${randomItem(CITIES)}, Tamil Nadu', '');\n`;

    // Appointments & Treatments
    let numVisits = isRegular ? random(4, 8) : random(1, 3);
    let totalCost = 0;
    let baseDate = randomDate(sixMonthsAgo, now);

    for (let v = 0; v < numVisits; v++) {
        let visitDate = new Date(baseDate.getTime() + (v * 7 * 24 * 60 * 60 * 1000)); // 1 week apart
        if (visitDate > now) visitDate = now;

        let aptId = `APT-${ptId}-${v}`;
        appointmentsSQL += `INSERT INTO public.appointments (id, name, time, type, status, date) VALUES ('${aptId}', '${fname} ${lname}', '10:00 AM', '${v === 0 ? 'First Visit' : 'Follow-up'}', 'Completed', '${ymd(visitDate)}');\n`;

        // Add treatments
        let trt = randomItem(TREATMENTS);
        let histId = `HST-${ptId}-${v}`;
        historySQL += `INSERT INTO public.patient_history (id, patient_id, date, treatment, category, cost, notes, tooth) VALUES ('${histId}', '${ptId}', '${ymd(visitDate)}', '${trt.name}', '${trt.category}', ${trt.price}, 'Perform by ${primaryDoc.name}', 11);\n`;

        totalCost += trt.price;

        let billId = `BIL-${ptId}-${v}`;
        billsSQL += `INSERT INTO public.bills (id, patient_id, amount, status, date) VALUES ('${billId}', '${ptId}', ${trt.price}, 'paid', '${ymd(visitDate)}');\n`;
    }

    // update patient total spent
    patientsSQL += `UPDATE public.patients SET total_spent = ${totalCost} WHERE id = '${ptId}';\n`;
}

const finalSQL = `
-- SEED DATA - V3
-- DOCTORS
${doctorsSQL}

-- PATIENTS
${patientsSQL}

-- APPOINTMENTS
${appointmentsSQL}

-- HISTORY
${historySQL}

-- BILLING
${billsSQL}
`;

fs.writeFileSync('supabase/seed_comprehensive.sql', finalSQL);
fs.writeFileSync('supabase/tooth_chart_seed.json', JSON.stringify(patientChartJSON, null, 2));
console.log('Seed files generated!');
