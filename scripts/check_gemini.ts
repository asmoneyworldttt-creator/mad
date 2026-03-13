import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const apiKey = process.env.VITE_GEMINI_API_KEY;

async function checkKey() {
    if (!apiKey) {
        console.error("❌ Gemini API Key is missing from .env");
        return;
    }

    console.log(`Checking key: ${apiKey.substring(0, 5)}...`);

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say 'hello'");
        const response = await result.response;
        console.log("✅ API KEY IS VALID. Response: " + response.text());
    } catch (err: any) {
        console.error("❌ API KEY IS INVALID OR FAILED. Error: " + err.message);
    }
}

checkKey();
