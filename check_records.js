import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const parseEnv = (text) => Object.fromEntries(text.split('\n').filter(line => line.includes('=')).map(line => {
    const [k, ...v] = line.split('=');
    return [k.trim(), v.join('=').trim().replace(/^"|"$/g, '')];
}));
const env = parseEnv(envText);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log('Fetching rows with absolute keys...');
    
    // Test the exact query causing failure
    const { data: plansData, error: pError } = await supabase
        .from('treatment_plans')
        .select('*, treatment_plan_items(*)')
        .limit(5);

    console.log('\n--- Patient Overview Plans Check ---');
    if (pError) console.error('Error:', pError);
    console.log('Plans Count:', plansData?.length || 0);
    if (plansData && plansData.length > 0) console.log('Sample Plan:', plansData[0]);
}

check();
