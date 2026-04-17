from pydantic import BaseModel
from typing import List, Optional

class Node(BaseModel):
    id: str
    label: str
    summary: str # Short 1-sentence hook
    content: str # The "Detailed" explanation for learning

class Edge(BaseModel):
    source: str
    target: str
    relation: str

class GraphData(BaseModel):
    title: str
    summary: str
    nodes: List[Node]
    edges: List[Edge]