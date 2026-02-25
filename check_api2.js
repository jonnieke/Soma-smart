const url = 'https://lpbcxruekqigvcksbkgr.supabase.co/rest/v1';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwYmN4cnVla3FpZ3Zja3Nia2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NTAyOTcsImV4cCI6MjA4NDQyNjI5N30.aSWKl3R6tQgVQPIZol8Hgbws3nN_qCCs5ujWmc7HkPM';

async function fix() {
    const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

    const res = await fetch(`${url}/profiles?student_id=ilike.SOMA-1848&select=*`, { headers });
    const profiles = await res.json();
    const profile = profiles[0];

    console.log("Tier:", profile.subscription_tier);
    console.log("Expiry:", profile.subscription_expiry);

    const now = new Date();
    const expiry = new Date(profile.subscription_expiry);
    console.log("Is Expired?", expiry < now, "| Now:", now.toISOString(), "| Expiry:", expiry.toISOString());

}
fix();
