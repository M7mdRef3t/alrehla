
import { GeminiClient } from './src/services/geminiClient.js';
import dotenv from 'dotenv';
dotenv.config();

async function testGemini() {
    const client = new GeminiClient();
    console.log("Testing Gemini connectivity...");
    try {
        const response = await client.generate("Say hello in Egyptian Arabic");
        console.log("Response:", response);
    } catch (error) {
        console.error("Error:", error);
    }
}

testGemini();
