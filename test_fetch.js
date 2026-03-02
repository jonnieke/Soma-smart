async function testFetch() {
    const urls = [
        "https://lpbcxruekqigvcksbkgr.supabase.co/storage/v1/object/public/syllabus-docs/dummy.pdf",
        "https://lpbcxruekqigvcksbkgr.supabase.co/storage/v1/object/public/knowledge-base/exams/sample.pdf",
        // Test a generic public pdf to see if issue is Supabase or Deno fetch globally
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    ];

    for (const url of urls) {
        console.log("----");
        console.log("Fetching...", url);
        try {
            const res = await fetch(url);
            console.log("Status:", res.status);
            if (!res.ok) {
                console.log("Error Text:", await res.text());
            } else {
                console.log("Success! Bytes:", (await res.arrayBuffer()).byteLength);
            }
        } catch (e) {
            console.error("Fetch threw:", e.message);
        }
    }
}
testFetch();
