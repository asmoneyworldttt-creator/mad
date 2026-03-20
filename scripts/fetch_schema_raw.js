import dotenv from 'dotenv';
dotenv.config({ path: 'd:/live p/medpro/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function test() {
    const json = await fetch(`${supabaseUrl}/rest/v1/`, { headers: { 'apikey': supabaseKey } }).then(r => r.json());
    console.log('Tables:', Object.keys(json.definitions || {}));
    const res = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: 'clinical-assets',
            name: 'clinical-assets',
            public: true
        })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response Body:', text);
}

test();
