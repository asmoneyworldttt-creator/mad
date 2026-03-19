import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function run() {
    const { data: staff, error } = await supabase.from('staff').select('name, role');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("--- STAFF ROLES ---");
        console.log(JSON.stringify(staff, null, 2));
    }
}

run();
