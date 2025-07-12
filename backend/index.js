// backend/server.js

const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

// ✅ Dynamic fetch for CommonJS (Node.js <v18 or not using ESM)
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Format AI response into readable paragraphs
function formatResponse(text) {
    if (!text) return [];
    const sentences = text.split(/(?<=\.)\s+/g);
    const paragraphs = [];
    let current = [];

    for (let i = 0; i < sentences.length; i++) {
        current.push(sentences[i]);
        if (current.length >= 2 || i === sentences.length - 1) {
            paragraphs.push(current.join(' '));
            current = [];
        }
    }

    return paragraphs;
}

// ✅ Fetch transcript from FastAPI Python server
async function fetchFullTranscript(videoId) {
    try {
        const res = await fetch('http://localhost:9000/transcript', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId })
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.error || 'Transcript fetch failed');
        }

        return data.transcript;
    } catch (error) {
        console.error('❌ Transcript fetch failed:', error.message);
        throw error;
    }
}

// ✅ Gemini AI call
async function getResponse(transcriptText, inputText, apiKey, message = '') {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{
            parts: [{
                text: `Please provide a reply for: "${inputText}".\n\nTranscript:\n${transcriptText}\n\nPrevious context:\n${message}`
            }]
        }]
    });

    const reply = response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No response generated';
    return {
        raw: reply,
        formatted: formatResponse(reply)
    };
}

// ✅ API Endpoint
app.post('/chat/:videoId', async (req, res) => {
    const { videoId } = req.params;
    const { inputText, apiKey, message } = req.body;

    if (!inputText || !apiKey) {
        return res.status(400).json({ error: 'Missing inputText or apiKey' });
    }

    try {
        let transcript = await fetchFullTranscript(videoId);

        // Retry if too short
        if (transcript.length < 10) {
            await new Promise(r => setTimeout(r, 1000));
            transcript = await fetchFullTranscript(videoId);
        }

        const response = await getResponse(transcript, inputText, apiKey, message);

        res.json({
            summary: response.raw
        });;

    } catch (err) {
        console.error('❌ Final error:', err.message);
        res.status(500).json({ error: err.message || 'Server error' });
    }
});

// ✅ Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
