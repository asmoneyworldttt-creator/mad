import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function run() {
    const { data: bills, error } = await supabase.from('bills').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
    } else if (bills.length > 0) {
        console.log("Bills Columns:", Object.keys(bills[0]));
        console.log("Bills Sample:", JSON.stringify(bills[0], null, 2));
    } else {
        console.log("No bills found to inspect columns");
    }
}
run();
