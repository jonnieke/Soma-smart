async function test() {
  try {
    const res = await fetch('https://lpbcxruekqigvcksbkgr.supabase.co/functions/v1/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model: 'gemini-2.5-flash', contents: [{role: 'user', parts: [{text: 'hello'}]}], stream: false })
    });
    console.log(`Status: ${res.status}`);
    console.log(`Text: ${await res.text()}`);
  } catch (err) {
    console.error(err);
  }
}
test();
