const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// Function to split text into paragraphs
function formatResponse(text) {
    if (!text) return [];

    // Split on periods followed by space or new lines
    const sentences = text.split(/(?<=\.)\s+/g);

    // Group sentences into paragraphs of 2-3 sentences each
    const paragraphs = [];
    let currentParagraph = [];

    for (let i = 0; i < sentences.length; i++) {
        currentParagraph.push(sentences[i]);

        // Create a new paragraph every 2-3 sentences
        if (currentParagraph.length >= 2 || i === sentences.length - 1) {
            paragraphs.push(currentParagraph.join(' '));
            currentParagraph = [];
        }
    }

    return paragraphs;
}

// Gemini Response Function
async function getResponse(transcriptText, userInput, apiKey, message) {
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash', // or 'gemini-1.5-pro'
            contents: [
                {
                    parts: [
                        {
                            text: `Please provide a reply for: "${userInput}". Here is the video transcript:\n\n${transcriptText} previous context array use it only if required ${message}`
                        }
                    ]
                }
            ]
        });

        const reply = response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
        console.log('Gemini response:', reply);

        // Format the response into paragraphs
        const formattedReply = formatResponse(reply);
        return {
            raw: reply,
            formatted: formattedReply
        };

    } catch (error) {
        console.error('Error generating response:', error);
        throw new Error('Failed to generate response from Gemini');
    }
}

// Helper to fetch and join transcript
async function fetchFullTranscript(videoId) {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map(t => t.text).join(' ');
}

// Main Endpoint
app.post('/chat/:videoId', async (req, res) => {
    const { videoId } = req.params;
    const { inputText, apiKey, message } = req.body;

    if (!inputText || !apiKey) {
        return res.status(400).json({ error: 'Missing inputText or apiKey in request body' });
    }

    console.log(`Received API key: ${apiKey ? 'Provided' : 'Missing'}`);
    console.log(`Fetching transcript for video ID: ${videoId}`);

    try {
        let fullText = await fetchFullTranscript(videoId);
        console.log(`Initial transcript length: ${fullText.length}`);

        // Retry once if transcript too short
        if (fullText.length <= 10) {
            console.log('Transcript too short. Retrying...');
            fullText = await fetchFullTranscript(videoId);
            console.log(`Retry transcript length: ${fullText.length}`);
        }

        if (fullText.length <= 10) {
            return res.status(400).json({ error: 'Transcript too short after retry. Try again later.' });
        }

        // Get response with formatted paragraphs
        const response = await getResponse(fullText, inputText, apiKey, message);

        res.json({
            fullText,
            summary: response.raw,
            formattedSummary: response.formatted
        });

    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            error: 'Could not fetch transcript or generate summary',
            details: err.message
        });
    }
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});