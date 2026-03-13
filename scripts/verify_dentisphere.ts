import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ SUPABASE URL or KEY missing from .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
    console.log("🚀 Starting DentiSphere Backend Final Diagnostic...");

    const testPatientId = "TESTPAT-" + Math.random().toString(36).substring(7).toUpperCase();
    const testName = "Integration Test Patient";

    try {
        // 1. Create Patient
        console.log(`\n🔹 STEP 1: Creating patient ${testPatientId}...`);
        const { error: pError } = await supabase
            .from('patients')
            .insert([{ id: testPatientId, name: testName, age: 30, gender: 'Male', phone: '+91 9999999999' }]);

        if (pError) throw pError;
        console.log("✅ Patient created successfully.");

        // 2. Book Appointment (Uses 'name' string, not foreign key 'patient_id'!)
        console.log("\n🔹 STEP 2: Booking appointment (linked via name)...");
        const { error: aError } = await supabase
            .from('appointments')
            .insert([{
                name: testName,
                date: new Date().toISOString().split('T')[0],
                time: '10:15 AM',
                status: 'Confirmed',
                notes: 'Test diagnostic entry'
            }]);

        if (aError) throw aError;
        console.log("✅ Appointment booked successfully.");

        // 3. Record Treatment History (Properly linked via patient_id)
        console.log("\n🔹 STEP 3: Recording treatment history (linked via patient_id)...");
        const { error: hError } = await supabase
            .from('patient_history')
            .insert([{
                patient_id: testPatientId,
                date: new Date().toISOString().split('T')[0],
                treatment: 'Comprehensive Checkup',
                cost: 1500
            }]);

        if (hError) throw hError;
        console.log("✅ Treatment history recorded.");

        // 4. Generate Bill (Linked via patient_id)
        console.log("\n🔹 STEP 4: Generating Bill...");
        const { error: bError } = await supabase
            .from('bills')
            .insert([{
                patient_id: testPatientId,
                amount: 1500,
                date: new Date().toISOString().split('T')[0],
                status: 'Paid',
                treatment_name: 'Comprehensive Checkup'
            }]);

        if (bError) throw bError;
        console.log("✅ Bill generated successfully.");

        // 5. Verification
        console.log("\n🔹 STEP 5: Verifying workflow data sync...");

        // Check history count
        const { count: hCount } = await supabase
            .from('patient_history')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', testPatientId);

        // Check appointment retrieval by name
        const { data: aData } = await supabase
            .from('appointments')
            .select('notes')
            .eq('name', testName);

        console.log(`📈 History Entries: ${hCount} (Expected 1)`);
        console.log(`� Appointment Notes Found: "${aData?.[0]?.notes}" (Expected Match)`);

        if (hCount === 1 && aData?.[0]?.notes === 'Test diagnostic entry') {
            console.log("\n✨ RESULT: WORKFLOW CORE IS FUNCTIONAL.");
        } else {
            console.warn("\n⚠️ RESULT: Data integrity check failed.");
        }

        // CLEANUP
        console.log("\n🧹 Cleaning up test data...");
        await supabase.from('bills').delete().eq('patient_id', testPatientId);
        await supabase.from('patient_history').delete().eq('patient_id', testPatientId);
        await supabase.from('appointments').delete().eq('name', testName);
        await supabase.from('patients').delete().eq('id', testPatientId);
        console.log("✅ Cleanup complete.");

    } catch (err: any) {
        console.error("\n💥 TEST FAILED:", err.message);
    }
}

runTests();
