
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Loading .env from ${envPath}`);
dotenv.config({ path: envPath });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY not found in process.env");
    console.log("Env contents:", Object.keys(process.env));
    process.exit(1);
}

console.log(`API Key loaded (first 5 chars): ${apiKey.substring(0, 5)}...`);

async function run() {
    const ai = new GoogleGenAI({ apiKey: apiKey });

    console.log("\n--- 1. Listing Models ---");
    try {
        const listResp = await ai.models.list();
        console.log("List success!");
        // The structure might be response.models or response itself is iterable
        // @ts-ignore
        const models = listResp.models || listResp;

        if (Array.isArray(models)) {
            models.forEach((m: any) => console.log(` - ${m.name}`));
        } else {
            console.log("Response structure:", JSON.stringify(listResp, null, 2));
        }

    } catch (e: any) {
        console.error("List FAILED:");
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Data:", JSON.stringify(e.response.data, null, 2));
        } else {
            console.error(e.message || e);
        }
    }

    console.log("\n--- 2. Testing Generation (gemini-1.5-flash) ---");
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: { parts: [{ text: "Hello" }] }
        });
        console.log("Gen Success:", res.text);
    } catch (e: any) {
        console.error("Gen FAILED:", e.message);
    }
}

run();
