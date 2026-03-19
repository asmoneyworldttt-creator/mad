import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function run() {
    const { data, error } = await supabase
        .from('clinical_notes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error:", error);
    } else {
        const rows = data.map(r => {
            try {
                return { ...r, plan_parsed: JSON.parse(r.plan) };
            } catch (e) {
                return r;
            }
        });
        console.log("Clinical Notes Rows:", JSON.stringify(rows, null, 2));
    }
}
run();
