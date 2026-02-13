import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const testSearch = async () => {
    console.log('--- Testing RAG Search ---');
    try {
        const response = await axios.post(
            `${SUPABASE_URL}/functions/v1/search-knowledge`,
            { query: "science" },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );

        console.log('Status:', response.status);
        console.log('Result:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

testSearch();
