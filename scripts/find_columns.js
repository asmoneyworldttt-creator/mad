
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    // Try to get columns for lab_orders
    const { data, error } = await supabase.rpc('get_columns', { table_name: 'lab_orders' });
    if (error) {
        console.error('RPC Error:', error.message);
        // Try direct select from a system view if possible? No.
        
        // I'll try to find a column name that works.
        // Let's try many possible ones.
        const likely = ['id', 'order_id', 'status', 'order_status', 'created_at', 'case_id'];
        for (const col of likely) {
            const { error: e2 } = await supabase.from('lab_orders').select(col).limit(1);
            if (!e2) {
                console.log(`Column ${col} exists!`);
            } else {
                console.log(`Column ${col} NOT here: ${e2.message}`);
            }
        }
    } else {
        console.log('Columns:', data);
    }
}
checkSchema();
