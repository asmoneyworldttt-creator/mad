import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log('Testing select on insurance_providers...');
    const { data, error } = await supabase.from('insurance_providers').select('*').limit(1);
    
    if (error) {
        console.log('\nResult Error or missing table:', error.message);
    } else {
        console.log('\nTable exists! Rows found:', data ? data.length : 0);
    }
}

check();
