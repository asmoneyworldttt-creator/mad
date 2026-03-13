
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    // Let's insert a dummy row and then delete it to see columns of empty tables
    // Or just try to select one and see what error or result we get.
    // If table is empty, we can't see keys. I'll try to insert a dummy.
    const tables = ['staff_members', 'lab_orders'];
    for (const table of tables) {
        console.log(`Checking table definition for: ${table}`);
        // We can use a query that intentionally fails with a bad column to see if it lists columns? No.
        // Let's try to get one row again.
    }
}
async function run() {
    // Actually, I'll just check if staff has salary by trying to select ONLY it.
    const { error } = await supabase.from('staff').select('salary').limit(1);
    console.log('staff.salary error:', error?.message);

    const { error: e2 } = await supabase.from('staff_members').select('full_name').limit(1);
    console.log('staff_members.full_name error:', e2?.message);
}
run();
