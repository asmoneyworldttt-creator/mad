import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTables() {
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Checking tables via REST API");
    // Since we don't know the exact schema, we might not have a generic RPC to execute SQL.
    // Let's try to query an existing table like "patients"
    const tables = ['patients', 'visits', 'treatments', 'earnings', 'roles', 'staff'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table ${table} error:`, error.message);
        } else {
            console.log(`Table ${table} exists, columns:`, Object.keys(data[0] || {}).join(', '));
        }
    }
}

checkTables().catch(console.error);
