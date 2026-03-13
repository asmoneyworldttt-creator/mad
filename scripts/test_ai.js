
import 'dotenv/config';

const apiKey = process.env.VITE_OPENROUTER_API_KEY;

async function testAI() {
    console.log('Testing OpenRouter Key:', apiKey ? 'Key found' : 'Key missing');
    if (!apiKey) return;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://dentora.clinic',
                'X-Title': 'Dentora AI',
            },
            body: JSON.stringify({
                model: 'openrouter/auto',
                messages: [{ role: 'user', content: 'hi' }],
            }),
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Test Error:', err);
    }
}

testAI();
