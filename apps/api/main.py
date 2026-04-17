import os
import shutil
import torch
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# LlamaIndex imports for the Ingestion Phase
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from services.graph_service import query_document

# Import our Groq-powered Agent pipeline
from services.graph_service import generate_graph_from_llm

app = FastAPI(title="Flowww AI Backend")

# ---------------------------------------------------------
# 1. CORS CONFIGURATION (The "Timeout Fix")
# ---------------------------------------------------------
# This allows Next.js (port 3000) to send large files directly 
# to FastAPI (port 8000), completely bypassing the proxy limits.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# 2. GLOBAL EMBEDDING SETUP (Local RTX 3050)
# ---------------------------------------------------------
# We use the GPU strictly for embeddings (fast & free). 
# Text generation is handled by Groq in graph_service.py.
device = "cuda" if torch.cuda.is_available() else "cpu"
Settings.embed_model = HuggingFaceEmbedding(
    model_name="BAAI/bge-small-en-v1.5",
    device=device
)

# Ensure our directories exist
UPLOAD_DIR = "./uploads"
STORAGE_DIR = "./storage"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STORAGE_DIR, exist_ok=True)


# ---------------------------------------------------------
# 3. ROUTES
# ---------------------------------------------------------

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Receives the PDF from the browser, saves it, and immediately 
    processes it into vector embeddings using the local GPU.
    """
    try:
        # Step A: Save the physical file
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"📄 Received {file.filename}. Starting ingestion...")
        
        # Step B: Read the PDF
        documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
        
        # Step C: Create Embeddings & Save to local Vector DB
        print(f"🧠 Creating vector embeddings on {device.upper()}...")
        index = VectorStoreIndex.from_documents(documents)
        index.storage_context.persist(persist_dir=STORAGE_DIR)
        
        print("✅ Vector DB updated successfully.")
        return {"filename": file.filename, "status": "success"}
        
    except Exception as e:
        print(f"❌ Upload/Ingestion Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/generate-flow")
async def generate_flow(topic: str = "Main Concepts"):
    """
    Triggers the Groq AI agents to read the vector DB and 
    generate the JSON graph.
    """
    try:
        print(f"🚀 Starting graph generation for topic: {topic}")
        # Call the dual-agent Groq pipeline
        graph_data = generate_graph_from_llm(topic)
        
        if "error" in graph_data:
            raise HTTPException(status_code=500, detail=graph_data["error"])
            
        return graph_data
        
    except Exception as e:
        print(f"❌ Generation Route Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    question: str

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Receives a question from the UI and passes it to the Gemini RAG engine.
    """
    try:
        response = query_document(request.question)
        if "error" in response:
            raise HTTPException(status_code=400, detail=response["error"])
        return response
    except Exception as e:
        print(f"❌ Route Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# 4. SERVER EXECUTION
# ---------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    # Use host="0.0.0.0" to prevent IPv4/IPv6 socket hang-ups
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)