import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { treatmentsMaster, mockPatients } from '../src/data/mockData.ts';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Seeding treatments master...');
    for (const t of treatmentsMaster) {
        const { error } = await supabase.from('treatments_master').upsert({
            id: t.id,
            category: t.category,
            name: t.name,
            price: t.price
        });
        if (error) console.error('Error inserting treatment:', error.message);
    }

    console.log('Seeding patients and history...');
    for (const p of mockPatients) {
        const { error: pError } = await supabase.from('patients').upsert({
            id: p.id,
            name: p.name,
            age: p.age,
            gender: p.gender,
            phone: p.phone,
            email: p.email,
            blood_group: p.bloodGroup,
            last_visit: p.lastVisit !== 'N/A' ? p.lastVisit : null,
            total_spent: p.totalSpent
        });
        if (pError) console.error(`Error inserting patient ${p.id}:`, pError.message);

        for (const h of p.history) {
            const { error: hError } = await supabase.from('patient_history').upsert({
                id: h.id,
                patient_id: p.id,
                date: h.date,
                treatment: h.treatment,
                category: h.category,
                cost: h.cost,
                notes: h.notes,
                tooth: h.tooth
            });
            if (hError) console.error(`Error inserting history ${h.id}:`, hError.message);
        }
    }

    console.log('Seeding Appointments...');
    const initialAppts = [
        { id: '1', name: 'Alisha Singh', time: '10:00 AM', type: 'Consultation', status: 'Confirmed', date: 'Today' },
        { id: '2', name: 'Vikram Patel', time: '11:30 AM', type: 'Follow up', status: 'Pending', date: 'Today' },
        { id: '3', name: 'Rahul Sharma', time: '02:00 PM', type: 'Root Canal', status: 'Engaged', date: 'Today' },
        { id: '4', name: 'Priya Verma', time: '04:15 PM', type: 'Checkup', status: 'Booked', date: 'Today' },
        { id: '5', name: 'Sanjay Kumar', time: '10:00 AM', type: 'Consultation', status: 'Confirmed', date: 'Weekly' },
        { id: '6', name: 'Anita Desai', time: '11:30 AM', type: 'Follow up', status: 'Pending', date: 'Weekly' },
        { id: '7', name: 'Ravi Teja', time: '02:00 PM', type: 'Root Canal', status: 'Booked', date: 'Monthly' }
    ];
    for (const a of initialAppts) {
        const { error } = await supabase.from('appointments').upsert(a);
        if (error) console.error(`Error inserting appointment ${a.id}:`, error.message);
    }

    const pendingAppts = [
        { id: 'p1', name: 'Arjun Nair', time: 'Today, 05:30 PM', type: 'Root Canal' }
    ];
    for (const a of pendingAppts) {
        const { error } = await supabase.from('pending_appointments').upsert(a);
        if (error) console.error(`Error inserting pending appt ${a.id}:`, error.message);
    }

    console.log('Seeding Complete! 🎉');
}

seed().catch(console.error);
