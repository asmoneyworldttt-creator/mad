import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ SUPABASE URL or SERVICE_ROLE_KEY missing from .env");
    process.exit(1);
}

// Initialize with Service Role Key to bypass RLS and use Admin API
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdmin() {
    console.log("🚀 Establishing Master Admin Node...");

    const email = 'admin@dentisphere.pro';
    const password = 'password123';

    try {
        // 1. Create the user in Auth
        const { data: userData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: 'Super Admin',
                role: 'admin'
            }
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                console.log("ℹ️ User already exists in Auth. Proceeding to profile sync...");
            } else {
                throw authError;
            }
        } else {
            console.log("✅ Auth user created successfully.");
        }

        // 2. Ensure Profile exists with 'admin' role
        // Since we have a trigger, it might already exist, but we enforce it here
        const userId = userData?.user?.id;
        if (userId) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    full_name: 'Super Admin',
                    role: 'admin'
                });

            if (profileError) throw profileError;
            console.log("✅ Profile synchronized with Admin privileges.");
        }

        console.log("\n✨ ADMIN ACCOUNT READY:");
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log("\nUse these credentials to establish your connection.");

    } catch (err: any) {
        console.error("\n💥 FAILED TO CREATE ADMIN:", err.message);
    }
}

createAdmin();
