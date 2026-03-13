
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log('Checking staff_members...');
    const cols = ['full_name', 'role_title', 'id'];
    for (const c of cols) {
        const { error } = await supabase.from('staff_members').select(c).limit(1);
        if (!error) console.log(`[YES] SM.${c}`);
        else console.log(`[NO]  SM.${c} (${error.message})`);
    }
}
check();
