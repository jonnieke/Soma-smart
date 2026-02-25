import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: profile } = await supabase.from('profiles').select('*').ilike('student_id', 'SOMA-1848').maybeSingle();
    console.log("Profile Data:", profile);

    if (profile) {
        const { data: txs } = await supabase.from('transactions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(5);
        console.log("Transactions:", txs);
    }
}
check();
