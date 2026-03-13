
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    const tables = ['payroll_transactions', 'staff_members', 'subscriptions', 'patient_history'];
    for (const table of tables) {
        console.log(`Checking table: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error in ${table}:`, error.message);
        } else {
            console.log(`Success ${table}:`, data.length > 0 ? Object.keys(data[0]) : 'Empty table');
        }
    }
}

checkSchema();
