import { createClient } from '@supabase/supabase-js';

const url = "https://dpwcnjoqyrxnukfwgrpi.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwd2Nuam9xeXJ4bnVrZndncnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNjEwMjksImV4cCI6MjA4NzgzNzAyOX0.g3feWVa5xnmUd-QMI1V-P4zK8N9DhCxnq3idjuHa2Ic";

const supabase = createClient(url, key);

async function check() {
    const { data, error } = await supabase.from('clinics').select('*');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Clinics Data:", data);
    }
}

check();
