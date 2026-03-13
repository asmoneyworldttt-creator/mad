
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const cols = ['amount', 'cost', 'date', 'order_date', 'lab_name', 'vendor', 'case_id', 'id', 'uuid'];
    for (const c of cols) {
        const { error } = await supabase.from('lab_orders').select(c).limit(1);
        if (!error) console.log(`[YES] lab_orders.${c}`);
    }
}
check();
