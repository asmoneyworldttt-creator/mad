
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    // Try to select a non-existent column to see the listed columns in the error message
    const { error } = await supabase.from('lab_orders').select('xyz_non_existent_column');
    console.log('Error message:', error?.message);
}
check();
