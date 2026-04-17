from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.huggingface import HuggingFaceEmbedding # Import local embeddings
from dotenv import load_dotenv
import os


load_dotenv()


def process_pdf(file_path: str):
    # 1. Use a local model (This downloads once, then runs offline for free)
    embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
    
    # 2. Load the PDF
    documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
    
    # 3. Split into chunks
    parser = SentenceSplitter(chunk_size=512, chunk_overlap=20)
    nodes = parser.get_nodes_from_documents(documents)
    
    # 4. Create Index using the local embedding model
    # We pass the embed_model here so it doesn't try to call OpenAI
    index = VectorStoreIndex(nodes, embed_model=embed_model)
    
    # 5. Persist locally
    index.storage_context.persist(persist_dir="./storage")
    
    return len(nodes)