import os
import subprocess
import tempfile
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow CORS for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_youtube_transcript(video_id: str):
    video_url = f"https://www.youtube.com/watch?v={video_id}"

    with tempfile.TemporaryDirectory() as tmpdir:
        command = [
            "yt-dlp",
            "--write-auto-sub",           # get auto-generated subs
            "--sub-lang", "en",           # specify language
            "--skip-download",            # don't download video
            "--sub-format", "vtt",        # get as .vtt
            "-o", f"{tmpdir}/%(id)s.%(ext)s",  # output path
            video_url
        ]

        result = subprocess.run(command, capture_output=True, text=True)

        if result.returncode != 0:
            return {"success": False, "error": result.stderr.strip()}

        vtt_file = os.path.join(tmpdir, f"{video_id}.en.vtt")
        if not os.path.exists(vtt_file):
            return {"success": False, "error": "Transcript not found (no captions or video is private)."}

        # Parse the VTT transcript
        with open(vtt_file, "r", encoding="utf-8") as f:
            lines = f.readlines()

        transcript = []
        for line in lines:
            line = line.strip()
            if line == "" or "-->" in line or line.isdigit():
                continue
            transcript.append(line)

        return {"success": True, "transcript": " ".join(transcript)}

@app.post("/transcript")
async def transcript(request: Request):
    try:
        body = await request.json()
        video_id = body.get("videoId")

        if not video_id:
            return {"success": False, "error": "Missing videoId"}

        return get_youtube_transcript(video_id)

    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}"}
