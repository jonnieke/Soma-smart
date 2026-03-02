// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLS() {
    console.log("Checking connection...");
    const { data, error } = await supabase.from('tutoring_requests').select('id').limit(1);
    if (error) {
        console.error("Connection failed:", error);
        return;
    }
    console.log("Connection OK.");

    console.log("Applying RPC test (since direct SQL execution requires RPC)...");
    // We can't execute raw DDL (CREATE POLICY) from supabase-js unless we have a specific RPC set up.
    // Instead, let's just query the policies to see what actually exists.
    const { data: rpcData, error: rpcError } = await supabase.rpc('execute_sql', { sql: 'SELECT * FROM pg_policies WHERE tablename = ''tutoring_requests'';' });

    if (rpcError) {
        console.log("RPC execute_sql failed or not found:", rpcError.message);
        console.log("Trying to insert a test request...");
        const { data: testData, error: testError } = await supabase.from('tutoring_requests').insert({
            student_id: 'test_student',
            teacher_id: '959973a7-a7a1-4dba-8c8d-7f801fd7ba69',
            topic: 'Test Topic'
        });
        console.log("Insert result:", testError || "Success");
    } else {
        console.log("Policies:", rpcData);
    }
}

applyRLS();
