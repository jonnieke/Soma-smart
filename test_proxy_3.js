async function test() {
  try {
    const res = await fetch('https://lpbcxruekqigvcksbkgr.supabase.co/functions/v1/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model: 'gemini-2.5-flash', contents: [{role: 'user', parts: [{text: 'hello'}]}], stream: true })
    });
    console.log(`Status: ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        console.log("Chunk:", decoder.decode(value));
    }
  } catch (err) {
    console.error(err);
  }
}
test();
