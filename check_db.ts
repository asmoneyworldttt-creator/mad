import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTables() {
    console.log("Checking tables...");
    const tables = ['patients', 'appointments', 'patient_history', 'bills', 'staff', 'earnings_transactions', 'staff_members', 'payroll_transactions'];
    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                console.log(`Table ${table} error: ${error.message}`);
            } else {
                console.log(`Table ${table} exists! Count: ${data?.length || 0}`);
                if (data && data.length > 0) {
                    console.log(`Table ${table} sample columns: ${Object.keys(data[0]).join(', ')}`);
                }
            }
        } catch (e) {
            console.log(`Table ${table} failed completely`);
        }
    }
}

checkTables().catch(console.error);
