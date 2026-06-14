/**
 * Soma Smart Edge Proxy Stress Tester
 * Simulates concurrent learner traffic and measures latency, throughput, and limit enforcements.
 * Uses native fetch (Node.js 18+).
 * 
 * Usage:
 *   node scripts/stress_tester.cjs [--concurrency=10] [--calls=20] [--mode=guest] [--student-codes=code1,code2]
 */

const fs = require('fs');
const path = require('path');

const url = 'https://lpbcxruekqigvcksbkgr.supabase.co/functions/v1/gemini-proxy';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwYmN4cnVla3FpZ3Zja3Nia2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NTAyOTcsImV4cCI6MjA4NDQyNjI5N30.aSWKl3R6tQgVQPIZol8Hgbws3nN_qCCs5ujWmc7HkPM';

// Parse arguments
const args = {};
process.argv.slice(2).forEach(val => {
    if (val.startsWith('--')) {
        const [k, v] = val.slice(2).split('=');
        args[k] = v;
    }
});

const concurrency = parseInt(args['concurrency'] || '5', 10);
const totalCalls = parseInt(args['calls'] || '15', 10);
const mode = args['mode'] || 'guest'; // guest, student
const providedCodes = args['student-codes'] ? args['student-codes'].split(',') : [];

console.log(`===================================================`);
console.log(`🚀 Soma Smart - Edge Proxy Stress Tester`);
console.log(`===================================================`);
console.log(`* Target Endpoint : ${url}`);
console.log(`* Concurrency     : ${concurrency} parallel requests`);
console.log(`* Total Calls     : ${totalCalls} requests`);
console.log(`* Mode            : ${mode.toUpperCase()}`);
if (mode === 'student') {
    console.log(`* Student Codes   : ${providedCodes.length > 0 ? providedCodes.join(', ') : 'None (falling back to SOMA-TEST-001)'}`);
}
console.log(`===================================================\n`);

async function sendRequest(id, studentCode = null) {
    const headers = {
        'Content-Type': 'application/json',
        'apikey': apiKey
    };

    if (studentCode) {
        headers['x-student-code'] = studentCode;
    }

    const payload = {
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: 'Respond with exactly one word: "OK".' }] }]
    };

    const startTime = Date.now();
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const duration = Date.now() - startTime;
        const body = await res.json().catch(() => ({}));

        return {
            id,
            status: res.status,
            duration,
            success: res.ok,
            error: res.ok ? null : (body.error || 'API Error'),
            code: body.code || null
        };
    } catch (e) {
        return {
            id,
            status: 'NETWORK_ERROR',
            duration: Date.now() - startTime,
            success: false,
            error: e.message,
            code: 'FETCH_FAIL'
        };
    }
}

async function startStressTest() {
    const results = [];
    const queue = Array.from({ length: totalCalls }, (_, i) => i + 1);
    
    // Determine student code rotation
    const codesList = mode === 'student' 
        ? (providedCodes.length > 0 ? providedCodes : ['SOMA-TEST-001', 'SOMA-TEST-002']) 
        : [];

    async function worker() {
        while (queue.length > 0) {
            const nextCallId = queue.shift();
            if (!nextCallId) break;

            const code = mode === 'student' ? codesList[(nextCallId - 1) % codesList.length] : null;
            const res = await sendRequest(nextCallId, code);
            results.push(res);
            
            // Print brief log
            const statusIndicator = res.success ? '✅ 200' : `❌ ${res.status}`;
            const limitIndicator = res.code === 'FEATURE_LIMIT_REACHED' ? ' [LIMIT BLOCKED]' : '';
            console.log(`[Req #${res.id}] Status: ${statusIndicator}${limitIndicator} | Latency: ${res.duration}ms`);
        }
    }

    const startTime = Date.now();
    
    // Spawn workers
    const workers = Array.from({ length: Math.min(concurrency, totalCalls) }, () => worker());
    await Promise.all(workers);

    const totalDuration = Date.now() - startTime;
    processResults(results, totalDuration);
}

function processResults(results, totalDuration) {
    const successCount = results.filter(r => r.success).length;
    const limitReachedCount = results.filter(r => r.code === 'FEATURE_LIMIT_REACHED').length;
    const errorCount = results.length - successCount - limitReachedCount;

    const latencies = results.map(r => r.duration);
    const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);

    console.log(`\n===================================================`);
    console.log(`📊 Stress Test Results`);
    console.log(`===================================================`);
    console.log(`* Overall Time      : ${(totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`* Average Latency   : ${avgLatency}ms`);
    console.log(`* Min/Max Latency   : ${minLatency}ms / ${maxLatency}ms`);
    console.log(`* Successful (200)  : ${successCount} calls`);
    console.log(`* Limit Blocked(429): ${limitReachedCount} calls`);
    console.log(`* Failed/Errors     : ${errorCount} calls`);
    console.log(`* Success Rate      : ${((successCount / results.length) * 100).toFixed(1)}%`);
    console.log(`===================================================`);

    if (errorCount > 0) {
        console.log(`\n⚠️ Error details:`);
        results.filter(r => !r.success && r.code !== 'FEATURE_LIMIT_REACHED').slice(0, 5).forEach(r => {
            console.log(`- Req #${r.id} Status: ${r.status} | Error: ${r.error}`);
        });
    }
}

startStressTest();
