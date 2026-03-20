import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'd:/live p/medpro/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing appointments schema triggers...');
    // We cannot run raw SQL over anon key easily without RPC, but usually anon key allows examining RPCs or functions if available
    // Let's try to query full row of appointments to see if we can read it to prove connection
    const { data, error } = await supabase.from('appointments').select('*').limit(1);
    if (data && data[0]) {
        console.log('Columns in appointments:', Object.keys(data[0]).join(', '));
    } else {
        console.log('No data found, Error:', error);
    }
}

test();

