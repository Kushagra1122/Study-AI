from fastapi import FastAPI, Request
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
from youtube_transcript_api._errors import TranscriptsDisabled
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/transcript")
async def get_transcript(request: Request):
    body = await request.json()
    video_id = body.get("videoId")

    try:
        # Try getting transcript in English first
        try:
            transcript_data = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
        except:
            # Fallback to Hindi if English is unavailable
            transcript_data = YouTubeTranscriptApi.get_transcript(video_id, languages=['hi'])

        transcript = ' '.join([entry['text'] for entry in transcript_data])
        return { "success": True, "transcript": transcript }

    except Exception as e:
        return { "success": False, "error": str(e) }
