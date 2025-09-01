from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class QueryInfo(BaseModel):
    name: str
    species: str
    taxid: Optional[int] = None

class UniProtInfo(BaseModel):
    accession: str
    reviewed: bool
    gene: Optional[str] = None
    protein_name: str
    organism: str
    length: int
    sequence: Optional[str] = None

class GOTerm(BaseModel):
    id: str
    name: str
    category: str  # BP, MF, CC
    evidence: Optional[str] = None

class GOAnnotations(BaseModel):
    biological_process: List[GOTerm] = []
    molecular_function: List[GOTerm] = []
    cellular_component: List[GOTerm] = []

class Domain(BaseModel):
    source: str  # InterPro, Pfam
    id: str
    name: str
    description: Optional[str] = None
    start: Optional[int] = None
    end: Optional[int] = None

class PDBEntry(BaseModel):
    id: str
    method: str
    resolution: Optional[float] = None
    chains: List[str] = []
    coverage: Optional[str] = None

class AlphaFoldModel(BaseModel):
    model_url: str
    pdb_url: str
    image_url: str
    confidence_avg: Optional[float] = None
    confidence_ranges: Optional[Dict[str, int]] = None  # very_high, confident, low, very_low

class StructureInfo(BaseModel):
    pdb_entries: List[PDBEntry] = []
    alphafold: Optional[AlphaFoldModel] = None

class Interaction(BaseModel):
    partner_id: str
    partner_name: str
    score: float
    source: str = "STRING"

class Pathway(BaseModel):
    database: str  # Reactome
    id: str
    name: str
    url: Optional[str] = None

class SourceLinks(BaseModel):
    uniprot: str
    rcsb: Optional[str] = None
    alphafold: Optional[str] = None
    string: Optional[str] = None
    reactome: Optional[str] = None

class ProvenanceInfo(BaseModel):
    source: str
    retrieved: datetime
    status: str  # success, error, partial

class ProteinReport(BaseModel):
    query: QueryInfo
    uniprot: UniProtInfo
    function_summary: str
    go_annotations: GOAnnotations
    domains: List[Domain] = []
    structures: StructureInfo
    interactions: List[Interaction] = []
    pathways: List[Pathway] = []
    source_links: SourceLinks
    provenance: List[ProvenanceInfo] = []
    
    # Card metadata
    rarity: str = Field(default="bronze")  # gold, silver, bronze
    completeness_score: float = Field(default=0.0, ge=0.0, le=1.0)

class ProteinSearchRequest(BaseModel):
    query: str
    species: Optional[str] = "Homo sapiens"
    include_sequence: bool = False

class ProteinSearchResponse(BaseModel):
    success: bool
    data: Optional[ProteinReport] = None
    error: Optional[str] = None
    processing_time: float
