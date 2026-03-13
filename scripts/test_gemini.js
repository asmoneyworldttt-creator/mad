
import 'dotenv/config';

const apiKey = process.env.VITE_GEMINI_API_KEY;

async function testGemini() {
    console.log('Testing Gemini Key:', apiKey ? 'Key found' : 'Key missing');
    if (!apiKey) return;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'hi' }] }],
            }),
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Test Error:', err);
    }
}

testGemini();
