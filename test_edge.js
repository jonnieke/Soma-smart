const url = 'https://lpbcxruekqigvcksbkgr.supabase.co/functions/v1/gemini-proxy';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwYmN4cnVla3FpZ3Zja3Nia2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NTAyOTcsImV4cCI6MjA4NDQyNjI5N30.aSWKl3R6tQgVQPIZol8Hgbws3nN_qCCs5ujWmc7HkPM';

async function testEdge() {
    const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

    // Testing a dummy but valid bucket URL
    const fetchUrl = "https://lpbcxruekqigvcksbkgr.supabase.co/storage/v1/object/public/syllabus-docs/dummy.pdf";

    const body = JSON.stringify({
        model: "gemini-2.5-flash",
        contents: [
            "Analyze this exam paper document.",
            { fetchUrl: { url: fetchUrl, mimeType: "application/pdf" } }
        ]
    });

    try {
        console.log("Sending request to edge proxy...");
        const res = await fetch(url, { method: 'POST', headers, body });
        const text = await res.text();
        console.log("Status:", res.status);
        if (res.status === 400 || res.status === 500) {
            console.error("Error Body:", text);
        } else {
            console.log("Body:", text.substring(0, 150));
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
testEdge();
