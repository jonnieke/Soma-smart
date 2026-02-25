import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.log("Missing Supabase credentials:", { url: !!supabaseUrl, key: !!supabaseKey });
} else {
    const supabase = createClient(supabaseUrl, supabaseKey);

    async function check() {
        try {
            console.log("Querying for SOMA-1848...");
            const { data: profile, error } = await supabase.from('profiles').select('*').ilike('student_id', 'SOMA-1848').maybeSingle();
            if (error) console.error("Profile Error:", error);
            console.log("Profile Data:", profile ? { id: profile.id, role: profile.role, tier: profile.subscription_tier, expiry: profile.subscription_expiry } : null);

            if (profile) {
                const { data: txs, error: txError } = await supabase.from('transactions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(5);
                if (txError) console.error("TX Error:", txError);
                console.log("Transactions:", txs);
            }
        } catch (e) {
            console.error(e);
        }
    }
    check();
}
