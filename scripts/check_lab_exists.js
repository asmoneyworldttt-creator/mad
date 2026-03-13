
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const { data, error } = await supabase.from('lab_orders').select('*');
    if (error) {
        console.error('Error in select(*):', error.message);
    } else {
        console.log('Success (empty result means table exists)');
    }
}
check();
