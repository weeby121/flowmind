import os
import shutil
import urllib.parse
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from youtube_transcript_api import YouTubeTranscriptApi

# Import your graph generation and chat functions
from services.graph_service import process_document, query_document
from services.generate_quiz import router as quiz_router

app = FastAPI()
app.include_router(quiz_router)

# Enable CORS so your Next.js frontend can talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 1. API Schemas
# ==========================================
class ChatRequest(BaseModel):
    question: str
    filenames: Optional[List[str]] = [] # NEW: Accept filenames from frontend

class YouTubeRequest(BaseModel):
    url: str

# ==========================================
# 2. Helper Functions
# ==========================================
def extract_video_id(url: str) -> str:
    """A robust YouTube URL parser to guarantee we get the video ID."""
    try:
        parsed_url = urllib.parse.urlparse(url)
        if parsed_url.hostname == 'youtu.be':
            return parsed_url.path[1:]
        if parsed_url.hostname in ('www.youtube.com', 'youtube.com'):
            if parsed_url.path == '/watch':
                p = urllib.parse.parse_qs(parsed_url.query)
                return p['v'][0]
            if parsed_url.path.startswith('/embed/'):
                return parsed_url.path.split('/')[2]
    except Exception as e:
        print(f"URL Parsing Error: {e}")
    return None

# ==========================================
# 3. API Routes
# ==========================================

# --- Route 1: PDF File Upload ---
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Receives a PDF from the frontend and saves it to the uploads folder."""
    try:
        os.makedirs("uploads", exist_ok=True)
        file_path = f"uploads/{file.filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"filename": file.filename}
    except Exception as e:
        print(f"❌ Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Route 2: Generate Graph from PDF ---
@app.get("/api/generate-flow")
async def generate_flow(topic: str):
    """Takes the uploaded PDF filename, processes it, and returns the Mind Map JSON."""
    try:
        file_path = f"uploads/{topic}"
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found on server.")
            
        print("🧠 Passing PDF to the AI Agent pipeline...")
        graph_data = process_document(file_path)
        return graph_data
    except Exception as e:
        print(f"❌ Graph Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Route 3: YouTube Import ---
@app.post("/api/youtube")
async def process_youtube(request: YouTubeRequest):
    """Downloads YouTube subtitles and turns them into a Mind Map."""
    try:
        video_id = extract_video_id(request.url)
        if not video_id:
            raise HTTPException(status_code=400, detail="Could not extract a valid YouTube Video ID.")

        print(f"📺 Fetching transcript for video: {video_id}...")
        
        ytt_api = YouTubeTranscriptApi()
        fetched_transcript = ytt_api.fetch(video_id)
        
        full_text = " ".join([t.text for t in fetched_transcript])
        
        os.makedirs("uploads", exist_ok=True)
        file_path = f"uploads/{video_id}.txt"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(full_text)
            
        print("🧠 Passing YouTube text to the AI Agent pipeline...")
        graph_data = process_document(file_path) 
        
        return graph_data

    except Exception as e:
        print(f"❌ YouTube Route Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Route 4: Chat with Document ---
@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """Receives a question and specific filenames, then passes them to the Gemini RAG engine."""
    try:
        # Pass BOTH the question and the scoped filenames down to LlamaIndex
        response = query_document(request.question, request.filenames)
        
        if "error" in response:
            raise HTTPException(status_code=400, detail=response["error"])
        return response
    except Exception as e:
        print(f"❌ Chat Route Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)