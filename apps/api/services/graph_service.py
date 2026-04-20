import os
import json
from pydantic import BaseModel, Field
from typing import List
import dotenv

# LlamaIndex & Embeddings
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, StorageContext, load_index_from_storage, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.gemini import Gemini

# Groq
from groq import Groq

dotenv.load_dotenv()


# ==========================================
# 1. API Keys & Configurations
# ==========================================
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

groq_client = Groq(api_key=GROQ_API_KEY)

# Set up local HuggingFace embeddings (Optimized for RTX 3050)
print("⚙️ Initializing local BGE embeddings...")
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

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


# ==========================================
# 3. Main RAG Pipeline (PDF/TXT -> JSON Graph)
# ==========================================
def process_document(file_path: str):
    """
    Ingests a document, vectorizes it locally, and uses Groq 70B to generate the JSON graph.
    """
    storage_path = "./storage"
    
    print(f"📄 Reading document: {file_path}")
    documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
    
    print("🧠 Building/Updating Local Vector Database...")
    index = VectorStoreIndex.from_documents(documents)
    index.storage_context.persist(persist_dir=storage_path)
    
    # Retrieve a broad set of context to build the overall mind map
    retriever = index.as_retriever(similarity_top_k=12)
    nodes = retriever.retrieve("Extract the primary concepts, sub-topics, definitions, and how they relate to one another.")
    research_text = "\n\n".join([n.node.text for n in nodes])

    # The foolproof prompt to ensure Groq 70B returns perfect JSON
    prompt = f"""
    TASK: Convert the research into a JSON Knowledge Graph.
    
    CRITICAL RULES:
    1. The JSON must exactly match the expected schema with 'nodes', 'edges', and a 'summary' string.
    2. Nodes array must ONLY contain objects with: id, label, summary, content.
    3. Edges array must ONLY contain objects with: source, target, relation.
    4. DO NOT put edge data inside a node object.
    
    EXPECTED FORMAT EXAMPLE:
    {{
      "nodes": [{{"id": "1", "label": "Concept", "summary": "Brief...", "content": "Deep dive..."}}],
      "edges": [{{"source": "1", "target": "2", "relation": "requires"}}],
      "summary": "A 2-3 sentence overview of the entire document."
    }}
    
    RESEARCH DATA:
    {research_text}
    """

    print("☁️ Agent 2 (Groq) is architecting the JSON Knowledge Graph...")
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert data architect. You output strict, valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0, # Zero creativity, maximum precision
            response_format={"type": "json_object"},
        )
        
        raw_response = completion.choices[0].message.content
        graph_data = json.loads(raw_response)
        
        print("✅ Graph successfully generated and validated.")
        return graph_data

    except Exception as e:
        print(f"❌ Groq Structural Error: {e}")
        return {"error": "Formatting failed", "details": str(e)}


# ==========================================
# 4. Chat Engine (Frontend Chat UI -> Gemini)
# ==========================================
def query_document(question: str):
    """
    Takes a question from the UI, searches the local vector DB, and answers using Gemini 1.5.
    """
    storage_path = "./storage"
    if not os.path.exists(storage_path):
        return {"error": "No knowledge base found. Please upload a PDF or YouTube link first."}

    storage_context = StorageContext.from_defaults(persist_dir=storage_path)
    index = load_index_from_storage(storage_context)

    # Use Gemini specifically for this query engine
    query_engine = index.as_query_engine(
        llm=chat_llm,
        similarity_top_k=5, 
    )
    
    try:
        print(f"💬 Asking Gemini: {question}")
        response = query_engine.query(question)
        return {"answer": str(response)}
    except Exception as e:
        print(f"❌ Chat Error: {e}")
        return {"error": "Failed to get an answer from Gemini."}