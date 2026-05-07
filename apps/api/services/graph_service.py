import os
import json
from pydantic import BaseModel, Field
from typing import List, Optional
import dotenv

# LlamaIndex & Embeddings
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, StorageContext, load_index_from_storage, Settings
from llama_index.llms.gemini import Gemini
from llama_index.core.vector_stores import MetadataFilters, MetadataFilter, FilterCondition

# --- NEW: Import FastEmbed Embeddings instead of HuggingFace ---
from llama_index.embeddings.fastembed import FastEmbedEmbedding

# Groq
from groq import Groq

dotenv.load_dotenv()


# ==========================================
# 1. API Keys & Configurations
# ==========================================
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

groq_client = Groq(api_key=GROQ_API_KEY)

# --- NEW: Use Google's Cloud Embeddings for instant processing ---
print("🚀 Initializing High-Speed Local Embeddings (FastEmbed)...")
Settings.embed_model = FastEmbedEmbedding(model_name="BAAI/bge-small-en-v1.5")

# 2. Global rate limit (Optional but recommended for large PDFs)
# This forces LlamaIndex to pause for a fraction of a second between chunks
Settings.chunk_size = 512  # Smaller chunks reduce the "Token Per Minute" load
Settings.num_output = 256

# Initialize Gemini for the blazing-fast Chat UI
chat_llm = Gemini(model="models/gemini-3.1-flash-lite-preview", api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


# ==========================================
# 2. Pydantic Schemas for Groq JSON Enforcing
# ==========================================
class Node(BaseModel):
    id: str
    label: str
    summary: str
    content: str

class Edge(BaseModel):
    source: str
    target: str
    relation: str

class GraphData(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    summary: str

class ChatRequest(BaseModel):
    question: str
    filenames: Optional[List[str]] = []


# ==========================================
# 3. Main RAG Pipeline (PDF/TXT -> JSON Graph)
# ==========================================
def process_document(file_path: str):
    storage_path = "./storage"
    
    print(f"📄 Reading document: {file_path}")
    documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
    
    print("🚀 Building/Updating Vector Database (FastEmbed)...")
    index = VectorStoreIndex.from_documents(documents)
    index.storage_context.persist(persist_dir=storage_path)
    
    # 1. REDUCE top_k slightly to keep the context "cleaner" and faster
    retriever = index.as_retriever(similarity_top_k=8) 
    nodes = retriever.retrieve("Identify the core architectural concepts and their relationships.")
    research_text = "\n\n".join([n.node.text for n in nodes])

    # 2. UPDATE PROMPT: Add a hard limit on nodes to prevent "Token Overrun"
    prompt = f"""
    TASK: Convert the research into a JSON Knowledge Graph.
    
    LIMITS: 
    - Generate a maximum of 10-12 nodes.
    - Keep 'content' fields focused (under 100 words per node).
    
    CRITICAL RULES:
    1. The JSON must exactly match the schema: 'nodes', 'edges', 'summary'.
    2. Nodes must have: id, label, summary, content.
    3. Edges must have: source, target, relation.
    
    RESEARCH DATA:
    {research_text}
    """

    print("☁️ Groq is architecting the JSON Knowledge Graph...")
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a concise data architect. You output ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0,
            # 3. INCREASE max_tokens: Allow the model enough room to finish the JSON
            max_tokens=4096, 
            response_format={"type": "json_object"},
        )
        
        raw_response = completion.choices[0].message.content
        graph_data = json.loads(raw_response)
        
        print("✅ Graph successfully generated.")
        return graph_data

    except Exception as e:
        print(f"❌ Groq Structural Error: {e}")
        return {"error": "Formatting failed", "details": str(e)}

# ==========================================
# 4. Chat Engine (Frontend Chat UI -> Gemini)
# ==========================================
def query_document(question: str, filenames: List[str] = None):
    """
    Takes a question, strictly filters the local vector DB to the provided filenames,
    and answers using Gemini.
    """
    storage_path = "./storage"
    if not os.path.exists(storage_path):
        return {"error": "No knowledge base found. Please upload a PDF or YouTube link first."}

    storage_context = StorageContext.from_defaults(persist_dir=storage_path)
    index = load_index_from_storage(storage_context)

    # --- ISOLATION: Apply Metadata Filters to block cross-document pollution ---
    filters = None
    if filenames and len(filenames) > 0:
        print(f"🔒 Scoping chat strictly to files: {filenames}")
        filter_list = [
            MetadataFilter(key="file_name", value=fname) for fname in filenames
        ]
        filters = MetadataFilters(filters=filter_list, condition=FilterCondition.OR)
    else:
        print("⚠️ No filenames provided. AI may hallucinate across multiple documents.")

    query_engine = index.as_query_engine(
        llm=chat_llm,
        similarity_top_k=5, 
        filters=filters 
    )
    
    try:
        print(f"💬 Asking Gemini: {question}")
        
        strict_question = (
            "You are a focused study assistant. Based STRICTLY on the retrieved context from my active document, "
            "answer the following question. If the answer is not present in the text, DO NOT guess. "
            "Politely state that the information is not in the current session's notes.\n\n"
            f"User Question: {question}"
        )
        
        response = query_engine.query(strict_question)
        return {"answer": str(response)}
        
    except Exception as e:
        print(f"❌ Chat Error: {e}")
        return {"error": "Failed to get an answer from Gemini."}