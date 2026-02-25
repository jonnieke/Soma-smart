const url = 'https://lpbcxruekqigvcksbkgr.supabase.co/rest/v1';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwYmN4cnVla3FpZ3Zja3Nia2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NTAyOTcsImV4cCI6MjA4NDQyNjI5N30.aSWKl3R6tQgVQPIZol8Hgbws3nN_qCCs5ujWmc7HkPM';

async function fix() {
    const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

    // 1. Get profile
    const res = await fetch(`${url}/profiles?student_id=ilike.SOMA-1848&select=*`, { headers });
    const profiles = await res.json();
    const profile = profiles[0];
    console.log("Profile:", profile);

    if (profile) {
        // 2. Get TX
        const txRes = await fetch(`${url}/transactions?user_id=eq.${profile.id}&order=created_at.desc&limit=1`, { headers });
        const txs = await txRes.json();
        console.log("TXS:", txs);
    }
}
fix();
