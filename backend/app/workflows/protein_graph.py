import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import google.generativeai as genai

from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage

from ..models.protein import (
    ProteinReport, QueryInfo, StructureInfo, SourceLinks, 
    ProvenanceInfo, ProteinSearchRequest
)
from ..services.uniprot import UniProtService
from ..services.pdb import PDBService
from ..services.alphafold import AlphaFoldService
from ..services.interpro import InterProService
from ..services.string_db import STRINGService
from ..services.reactome import ReactomeService
from ..config import settings

# Configure Gemini
genai.configure(api_key=settings.GOOGLE_API_KEY)

class ProteinWorkflowState:
    def __init__(self):
        self.query: Optional[ProteinSearchRequest] = None
        self.uniprot_accession: Optional[str] = None
        self.uniprot_data: Optional[Dict[str, Any]] = None
        self.pdb_data: list = []
        self.alphafold_data: Optional[Dict[str, Any]] = None
        self.interpro_data: list = []
        self.string_data: list = []
        self.reactome_data: list = []
        self.errors: list = []
        self.final_report: Optional[ProteinReport] = None

class ProteinWorkflow:
    def __init__(self):
        self.uniprot_service = UniProtService()
        self.pdb_service = PDBService()
        self.alphafold_service = AlphaFoldService()
        self.interpro_service = InterProService()
        self.string_service = STRINGService()
        self.reactome_service = ReactomeService()
        
        # Build the workflow graph
        self.workflow = self._build_workflow()
    
    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow"""
        
        # Define the workflow steps
        workflow = StateGraph(dict)
        
        # Add nodes
        workflow.add_node("resolver", self._resolve_protein_id)
        workflow.add_node("parallel_fetch", self._parallel_fetch_data)
        workflow.add_node("aggregator", self._aggregate_data)
        workflow.add_node("summarizer", self._generate_summary)
        workflow.add_node("validator", self._validate_and_finalize)
        
        # Define the flow
        workflow.add_edge("resolver", "parallel_fetch")
        workflow.add_edge("parallel_fetch", "aggregator")
        workflow.add_edge("aggregator", "summarizer")
        workflow.add_edge("summarizer", "validator")
        workflow.add_edge("validator", END)
        
        # Set entry point
        workflow.set_entry_point("resolver")
        
        return workflow.compile()
    
    async def process_protein_query(self, request: ProteinSearchRequest) -> ProteinReport:
        """Main entry point for processing protein queries"""
        
        # Initialize state
        initial_state = {
            "query": request,
            "uniprot_accession": None,
            "uniprot_data": None,
            "pdb_data": [],
            "alphafold_data": None,
            "interpro_data": [],
            "string_data": [],
            "reactome_data": [],
            "errors": [],
            "final_report": None
        }
        
        # Run the workflow
        result = await self._run_async_workflow(initial_state)
        
        return result["final_report"]
    
    async def _run_async_workflow(self, initial_state: Dict[str, Any]) -> Dict[str, Any]:
        """Run the workflow asynchronously"""
        state = initial_state.copy()
        
        # Execute workflow steps
        state = await self._resolve_protein_id(state)
        if state["uniprot_accession"]:
            state = await self._parallel_fetch_data(state)
            state = await self._aggregate_data(state)
            state = await self._generate_summary(state)
            state = await self._validate_and_finalize(state)
        
        return state
    
    async def _resolve_protein_id(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Step 1: Resolve query to UniProt accession"""
        try:
            request = state["query"]
            
            # Extract species info
            species = request.species or "Homo sapiens"
            
            # Resolve to UniProt accession
            accession = await self.uniprot_service.resolve_to_uniprot(
                request.query, species
            )
            
            if accession:
                state["uniprot_accession"] = accession
                state["errors"].append(ProvenanceInfo(
                    source="UniProt ID Resolution",
                    retrieved=datetime.now(),
                    status="success"
                ))
            else:
                state["errors"].append(ProvenanceInfo(
                    source="UniProt ID Resolution",
                    retrieved=datetime.now(),
                    status="error"
                ))
                
        except Exception as e:
            state["errors"].append(ProvenanceInfo(
                source="UniProt ID Resolution",
                retrieved=datetime.now(),
                status=f"error: {str(e)}"
            ))
        
        return state
    
    async def _parallel_fetch_data(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Step 2: Fetch data from all sources in parallel"""
        accession = state["uniprot_accession"]
        
        if not accession:
            return state
        
        # Create parallel tasks
        tasks = [
            self._fetch_uniprot_data(accession),
            self._fetch_pdb_data(accession),
            self._fetch_alphafold_data(accession),
            self._fetch_interpro_data(accession),
            self._fetch_string_data(accession),
            self._fetch_reactome_data(accession)
        ]
        
        # Execute all tasks in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Update state with results
        state["uniprot_data"] = results[0] if not isinstance(results[0], Exception) else None
        state["pdb_data"] = results[1] if not isinstance(results[1], Exception) else []
        state["alphafold_data"] = results[2] if not isinstance(results[2], Exception) else None
        state["interpro_data"] = results[3] if not isinstance(results[3], Exception) else []
        state["string_data"] = results[4] if not isinstance(results[4], Exception) else []
        state["reactome_data"] = results[5] if not isinstance(results[5], Exception) else []
        
        # Log any errors
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                source_names = ["UniProt", "PDB", "AlphaFold", "InterPro", "STRING", "Reactome"]
                state["errors"].append(ProvenanceInfo(
                    source=source_names[i],
                    retrieved=datetime.now(),
                    status=f"error: {str(result)}"
                ))
        
        return state
    
    async def _fetch_uniprot_data(self, accession: str):
        """Fetch UniProt data"""
        return await self.uniprot_service.fetch_protein_data(accession)
    
    async def _fetch_pdb_data(self, accession: str):
        """Fetch PDB data"""
        return await self.pdb_service.fetch_pdb_structures(accession)
    
    async def _fetch_alphafold_data(self, accession: str):
        """Fetch AlphaFold data"""
        return await self.alphafold_service.fetch_alphafold_model(accession)
    
    async def _fetch_interpro_data(self, accession: str):
        """Fetch InterPro data"""
        return await self.interpro_service.fetch_domains(accession)
    
    async def _fetch_string_data(self, accession: str):
        """Fetch STRING data"""
        return await self.string_service.fetch_interactions(accession)
    
    async def _fetch_reactome_data(self, accession: str):
        """Fetch Reactome data"""
        return await self.reactome_service.fetch_pathways(accession)
    
    async def _aggregate_data(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Step 3: Aggregate all data into a unified structure"""
        try:
            request = state["query"]
            accession = state["uniprot_accession"]
            
            if not accession or not state["uniprot_data"]:
                return state
            
            # Parse UniProt data
            uniprot_info, go_annotations = self.uniprot_service.parse_uniprot_data(
                state["uniprot_data"]
            )
            
            # Build query info
            query_info = QueryInfo(
                name=request.query,
                species=request.species or "Homo sapiens"
            )
            
            # Build structure info
            structures = StructureInfo(
                pdb_entries=state["pdb_data"] or [],
                alphafold=state["alphafold_data"]
            )
            
            # Build source links
            source_links = SourceLinks(
                uniprot=f"https://www.uniprot.org/uniprotkb/{accession}",
                rcsb=f"https://www.rcsb.org/search?q={accession}" if state["pdb_data"] else None,
                alphafold=f"https://alphafold.ebi.ac.uk/entry/{accession}" if state["alphafold_data"] else None,
                string=f"https://string-db.org/network/{accession}" if state["string_data"] else None,
                reactome=f"https://reactome.org/content/query?q={accession}" if state["reactome_data"] else None
            )
            
            # Create protein report (without summary yet)
            report = ProteinReport(
                query=query_info,
                uniprot=uniprot_info,
                function_summary="",  # Will be filled by summarizer
                go_annotations=go_annotations,
                domains=state["interpro_data"] or [],
                structures=structures,
                interactions=state["string_data"] or [],
                pathways=state["reactome_data"] or [],
                source_links=source_links,
                provenance=state["errors"]
            )
            
            # Calculate rarity and completeness
            report.rarity = self._calculate_rarity(report)
            report.completeness_score = self._calculate_completeness(report)
            
            state["final_report"] = report
            
        except Exception as e:
            state["errors"].append(ProvenanceInfo(
                source="Data Aggregation",
                retrieved=datetime.now(),
                status=f"error: {str(e)}"
            ))
        
        return state
    
    async def _generate_summary(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Step 4: Generate AI summary of protein function"""
        try:
            report = state["final_report"]
            if not report:
                return state
            
            # Prepare context for AI summarization
            context = self._build_summary_context(report)
            
            # Generate summary using Gemini
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""
            Create a concise, scientific summary of this protein based on the data provided.
            Focus on the main biological function and significance. Keep it under 150 words.
            
            Protein: {report.uniprot.protein_name} ({report.uniprot.gene or 'Unknown gene'})
            Organism: {report.uniprot.organism}
            
            Context:
            {context}
            
            Provide a clear, informative summary suitable for a researcher.
            """
            
            response = model.generate_content(prompt)
            summary = response.text.strip()
            
            # Update report with summary
            report.function_summary = summary
            state["final_report"] = report
            
        except Exception as e:
            # Fallback to basic summary if AI fails
            report = state["final_report"]
            if report:
                report.function_summary = f"Protein {report.uniprot.protein_name} from {report.uniprot.organism}. Length: {report.uniprot.length} amino acids."
            
            state["errors"].append(ProvenanceInfo(
                source="AI Summary",
                retrieved=datetime.now(),
                status=f"error: {str(e)}"
            ))
        
        return state
    
    def _build_summary_context(self, report: ProteinReport) -> str:
        """Build context string for AI summarization"""
        context_parts = []
        
        # GO terms
        if report.go_annotations.biological_process:
            bp_terms = [go.name for go in report.go_annotations.biological_process[:3]]
            context_parts.append(f"Biological processes: {', '.join(bp_terms)}")
        
        if report.go_annotations.molecular_function:
            mf_terms = [go.name for go in report.go_annotations.molecular_function[:3]]
            context_parts.append(f"Molecular functions: {', '.join(mf_terms)}")
        
        # Domains
        if report.domains:
            domain_names = [d.name for d in report.domains[:3]]
            context_parts.append(f"Key domains: {', '.join(domain_names)}")
        
        # Interactions
        if report.interactions:
            partner_names = [i.partner_name for i in report.interactions[:3]]
            context_parts.append(f"Key interactions: {', '.join(partner_names)}")
        
        # Pathways
        if report.pathways:
            pathway_names = [p.name for p in report.pathways[:3]]
            context_parts.append(f"Pathways: {', '.join(pathway_names)}")
        
        return "; ".join(context_parts)
    
    async def _validate_and_finalize(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Step 5: Final validation and cleanup"""
        try:
            report = state["final_report"]
            if report:
                # Ensure all required fields are present
                if not report.function_summary:
                    report.function_summary = f"Protein {report.uniprot.protein_name} from {report.uniprot.organism}."
                
                # Add final provenance entry
                state["errors"].append(ProvenanceInfo(
                    source="Workflow Completion",
                    retrieved=datetime.now(),
                    status="success"
                ))
                
                report.provenance = state["errors"]
        
        except Exception as e:
            state["errors"].append(ProvenanceInfo(
                source="Final Validation",
                retrieved=datetime.now(),
                status=f"error: {str(e)}"
            ))
        
        return state
    
    def _calculate_rarity(self, report: ProteinReport) -> str:
        """Calculate protein card rarity based on data completeness"""
        score = 0
        
        # Base score for reviewed proteins
        if report.uniprot.reviewed:
            score += 3
        
        # Structural data
        if report.structures.pdb_entries:
            score += 2
        if report.structures.alphafold:
            score += 1
        
        # Functional annotations
        if report.domains:
            score += 1
        if report.interactions:
            score += 1
        if report.pathways:
            score += 1
        
        # Determine rarity
        if score >= 7:
            return "gold"
        elif score >= 5:
            return "silver"
        else:
            return "bronze"
    
    def _calculate_completeness(self, report: ProteinReport) -> float:
        """Calculate completeness score (0.0 to 1.0)"""
        total_sources = 6  # UniProt, PDB, AlphaFold, InterPro, STRING, Reactome
        completed_sources = 1  # UniProt always present if we reach this point
        
        if report.structures.pdb_entries:
            completed_sources += 1
        if report.structures.alphafold:
            completed_sources += 1
        if report.domains:
            completed_sources += 1
        if report.interactions:
            completed_sources += 1
        if report.pathways:
            completed_sources += 1
        
        return completed_sources / total_sources
