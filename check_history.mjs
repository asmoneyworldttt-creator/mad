import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

console.log("URL:", process.env.VITE_SUPABASE_URL || "MISSING");

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function run() {
    try {
        const { data, error } = await supabase
            .from('patient_history')
            .select('*')
            .eq('category', 'Clinical')
            .limit(10);

        if (error) {
            console.error("Supabase Error:", error);
        } else {
            console.log("Clinical History Rows:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Crash Error:", e);
    }
}
run();
