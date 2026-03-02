// test_invoke.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEdgeWithInvoke() {
    const fetchUrl = "https://lpbcxruekqigvcksbkgr.supabase.co/storage/v1/object/public/knowledge-base/exams/sample.pdf";
    const mimeType = "application/pdf";

    const contents = [
        "Analyze this exam paper document.",
        { fetchUrl: { url: fetchUrl, mimeType: mimeType } }
    ];

    try {
        console.log("Invoking edge function...");
        const { data, error } = await supabase.functions.invoke('gemini-proxy', {
            body: {
                model: "gemini-2.5-flash",
                contents: contents
            }
        });

        if (error) {
            console.error("Invoke Error:", error);
        } else {
            console.log("Success:", JSON.stringify(data).substring(0, 100));
        }
    } catch (e) {
        console.error("Function failed:", e);
    }
}
testEdgeWithInvoke();
