
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check(table, columns) {
    for (const col of columns) {
        const { error } = await supabase.from(table).select(col).limit(1);
        if (!error) console.log(`[YES] ${table}.${col}`);
    }
}
run();
async function run() {
    await check('lab_orders', ['order_status', 'patient_name', 'test', 'procedure', 'test_name', 'lab_name', 'cost', 'date', 'patient_id', 'id']);
}
