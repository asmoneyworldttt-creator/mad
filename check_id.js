import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

async function main() {
    const s = createClient(url, key);
    const { data } = await s.from('patient_history').select('id').limit(1);
    console.log("ONE ROW ID TYPE:", data);
}

main();
