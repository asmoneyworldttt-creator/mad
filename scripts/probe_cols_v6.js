
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const cols = ['lab_name', 'vendor_name', 'service_name', 'clinical_note', 'diagnosis', 'comments', 'notes'];
    for (const c of cols) {
        const { error } = await supabase.from('lab_orders').select(c).limit(1);
        if (!error) console.log(`[YES] lab_orders.${c}`);
    }
}
check();
