import os
from dotenv import load_dotenv
from llama_index.core import StorageContext, load_index_from_storage
from llama_index.llms.groq import Groq
from models import GraphData
from llama_index.core import StorageContext,PromptTemplate
from llama_index.llms.gemini import Gemini

# Load environment variables
load_dotenv()

groq_api_key = os.environ.get("GROQ_API_KEY")
if not groq_api_key:
    print("⚠️ WARNING: GROQ_API_KEY not found in .env")

# ---------------------------------------------------------
# 1. AGENT 1: The Researcher (CLOUD - GROQ)
# ---------------------------------------------------------
# We use the 8B model to ensure we don't hit the strict Free Tier 
# rate limits associated with the massive 70B model.
research_llm = Groq(
    model="llama-3.1-8b-instant", 
    api_key=groq_api_key,
    temperature=0.2,
)

# ---------------------------------------------------------
# 2. AGENT 2: The Architect (CLOUD - GROQ)
# ---------------------------------------------------------
# We use temperature=0.0 to ensure strict JSON formatting logic
format_llm = Groq(
    model="llama-3.3-70b-versatile", 
    api_key=groq_api_key,
    temperature=0.0, 
)

def generate_graph_from_llm(query: str):
    storage_path = "./storage"
    if not os.path.exists(storage_path):
        return {"error": "No knowledge base found. Please upload a PDF first."}

    # Load the local vector database created by your RTX 3050
    storage_context = StorageContext.from_defaults(persist_dir=storage_path)
    index = load_index_from_storage(storage_context)

    # --- STEP 1: GROQ RESEARCHES ---
    # similarity_top_k=8 and response_mode="compact" completely bypasses the 
    # "429 Too Many Requests" error by packing chunks into fewer requests.
    query_engine = index.as_query_engine(
        llm=research_llm,
        similarity_top_k=8, 
        response_mode="compact" 
    )
    
    research_prompt = (
        f"You are an expert educator. Analyze the document regarding: '{query}'.\n"
        "1. Identify 5-7 core concepts. For each, provide a label and a detailed, student-friendly explanation (MAX 3 SENTENCES EACH).\n"
        "2. Explain exactly how these concepts connect to each other using active verbs (e.g., 'is compiled by', 'requires')."
    )
    
    print("⚡ Agent 1 (Groq) is analyzing the document...")
    research_response = query_engine.query(research_prompt)
    research_text = str(research_response)
    
    if not research_text.strip() or "Empty Response" in research_text:
        return {"error": "Researcher found no relevant data."}

    # --- STEP 2: GROQ FORMATS ---
    print("☁️ Agent 2 (Groq) is structuring the JSON Knowledge Graph...")
    
    # 1. We create a formal PromptTemplate object with a placeholder {research_data}
    architect_prompt_tmpl = PromptTemplate(
        "TASK: Convert the research into a JSON Knowledge Graph.\n"
        "CRITICAL RULES:\n"
        "1. Use the key 'summary' for short descriptions and 'content' for deep explanations.\n"
        "2. You MUST include an 'edges' array mapped from the research.\n\n"
        "RESEARCH DATA:\n{research_data}"
    )

    try:
        # 2. We pass the template and inject the text as a variable (much safer!)
        validated_data = format_llm.structured_predict(
            GraphData, 
            architect_prompt_tmpl,
            research_data=research_text
        )
        
        print("✅ Graph successfully generated and validated.")
        return validated_data.dict()
        
    except Exception as e:
        print(f"❌ Structural Error: {e}")
        return {"error": "Formatting failed", "details": str(e)}
    
# Initialize the Gemini LLM for blazing-fast chat
gemini_api_key = os.environ.get("GEMINI_API_KEY")
chat_llm = Gemini(
    model="models/gemini-3.1-flash-lite-preview", 
    api_key=gemini_api_key,
    temperature=0.3 # Low temperature so it stays factual to your notes
) if gemini_api_key else None

def query_document(question: str):
    """
    Takes a user question, searches the local vector DB, 
    and answers using Gemini.
    """
    storage_path = "./storage"
    if not os.path.exists(storage_path):
        return {"error": "No knowledge base found. Please upload a PDF first."}

    storage_context = StorageContext.from_defaults(persist_dir=storage_path)
    index = load_index_from_storage(storage_context)

    # We retrieve the top 5 most relevant chunks from your RTX 3050's vector DB
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