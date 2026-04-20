import os
import random
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import google.generativeai as genai
import PyPDF2  

# Configure Gemini (Make sure your GOOGLE_API_KEY is in your .env)
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

# Use Flash for speed and cost-efficiency
model = genai.GenerativeModel('models/gemini-3.1-flash-lite-preview')

router = APIRouter()

class QuizRequest(BaseModel):
    filenames: List[str]

# --- Helper: Extract & Chunk ---
def extract_and_sample_text(filenames: List[str], max_chunks=8, chunk_size=1000):
    all_chunks = []
    
    # Define where your uploaded files are stored
    UPLOAD_DIR = "./uploads" 
    
    for filename in filenames:
        filepath = os.path.join(UPLOAD_DIR, filename)
        if not os.path.exists(filepath):
            continue
            
        try:
            with open(filepath, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                
                # Split text into rough character chunks (1000 chars is ~200 words)
                chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
                
                # Grab a random sample from this specific file to ensure representation
                sample_size = min(2, len(chunks)) # Grab up to 2 chunks per file
                all_chunks.extend(random.sample(chunks, sample_size))
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            
    # If we have too many chunks overall, sample down to the max limit
    if len(all_chunks) > max_chunks:
        all_chunks = random.sample(all_chunks, max_chunks)
        
    return "\n\n---\n\n".join(all_chunks)

@router.post("/api/generate-quiz")
async def generate_quiz(req: QuizRequest):
    try:
        if not req.filenames:
            raise HTTPException(status_code=400, detail="No files provided")

        # 1. Get our strict, bounded context
        sampled_context = extract_and_sample_text(req.filenames)
        
        if not sampled_context.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from documents")

        # 2. The Strict JSON Prompt
        prompt = f"""
        You are an expert professor. Based strictly on the provided context, generate 5 difficult multiple-choice questions.
        
        Respond ONLY with a valid JSON array of objects. Do not use markdown blocks like ```json. 
        Each object must strictly match this format:
        {{
            "question": "The question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "The exact string of the correct option"
        }}
        
        CONTEXT:
        {sampled_context}
        """

        # 3. Call Gemini
        response = model.generate_content(prompt)
        
        # 4. Parse the JSON safely
        raw_text = response.text.strip()
        # Clean up in case Gemini wraps it in markdown anyway
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3].strip()
            
        quiz_json = json.loads(raw_text)

        return {"questions": quiz_json}

    except Exception as e:
        print(f"Quiz Gen Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to forge the quiz.")