
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    // Try to insert an empty object. It will fail with a list of columns if we are lucky? No.
    // Try to insert a row with a key that we know doesn't exist to see "available columns"? No.
    // Try to query the system view via RPC if possible? No.
    
    // I'll try to fetch all rows and see if any results come back.
    const { data, error } = await supabase.from('lab_orders').select('*');
    if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    } else {
        console.log('Table is empty.');
    }
}
check();
