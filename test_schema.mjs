import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env manually inside node stream!
const env = fs.readFileSync('d:\\live p\\medpro\\.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim()?.replace(/["']/g, '');
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim()?.replace(/["']/g, '');

console.log('URL:', url);
const supabase = createClient(url, key);

const { data, error } = await supabase.from('vital_signs').select('*').limit(1);
if (error) {
    console.error('Error:', error.message);
} else {
    // Or fetch a single known record layout!
    const { data: cols, error: err2 } = await supabase.rpc('execute_sql', { sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'vital_signs';" })
    console.log('Cols from RPC:', cols || err2?.message);
    if (!cols) {
        console.log('Fallback: data keys', data.length > 0 ? Object.keys(data[0]) : 'No rows existing yet.');
    }
}
