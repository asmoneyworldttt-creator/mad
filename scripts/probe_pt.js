
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log('Checking payroll_transactions...');
    const cols = ['staff_id', 'staff_name', 'role_title', 'month_year', 'salary_amount', 'bonus_amount', 'deductions', 'net_paid', 'payment_date', 'payment_status', 'payment_method', 'notes'];
    for (const c of cols) {
        const { error } = await supabase.from('payroll_transactions').select(c).limit(1);
        if (!error) console.log(`[YES] PT.${c}`);
        else console.log(`[NO]  PT.${c} (${error.message})`);
    }
}
check();
