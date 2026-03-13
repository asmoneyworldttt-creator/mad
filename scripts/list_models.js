
import 'dotenv/config';

const apiKey = process.env.VITE_OPENROUTER_API_KEY;

async function listModels() {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            }
        });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(err);
    }
}

listModels();
