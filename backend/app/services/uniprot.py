import httpx
import asyncio
from typing import Optional, Dict, Any, List
from ..models.protein import UniProtInfo, GOTerm, GOAnnotations
from ..config import settings

class UniProtService:
    def __init__(self):
        self.base_url = "https://rest.uniprot.org"
        self.timeout = 30.0
    
    async def resolve_to_uniprot(self, query: str, species: str = "Homo sapiens") -> Optional[str]:
        """Resolve gene/protein name to UniProt accession"""
        try:
            # Convert species to taxid if needed
            taxid = await self._get_taxid_for_species(species)
            
            # Search for protein
            search_query = f"{query} AND organism_id:{taxid}"
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/uniprotkb/search",
                    params={
                        "query": search_query,
                        "format": "json",
                        "size": "5",
                        "fields": "accession,reviewed,gene_names,protein_name"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])
                    
                    if results:
                        # Prefer reviewed (Swiss-Prot) entries
                        reviewed_entries = [r for r in results if r.get("entryAudit", {}).get("firstPublicDate")]
                        if reviewed_entries:
                            return reviewed_entries[0]["primaryAccession"]
                        else:
                            return results[0]["primaryAccession"]
                
                return None
                
        except Exception as e:
            print(f"Error resolving UniProt ID: {e}")
            return None
    
    async def fetch_protein_data(self, accession: str) -> Optional[Dict[str, Any]]:
        """Fetch comprehensive protein data from UniProt"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/uniprotkb/{accession}.json"
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"Failed to fetch UniProt data: {response.status_code}")
                    return None
                    
        except Exception as e:
            print(f"Error fetching UniProt data: {e}")
            return None
    
    def parse_uniprot_data(self, data: Dict[str, Any]) -> tuple[UniProtInfo, GOAnnotations]:
        """Parse UniProt JSON response into our models"""
        try:
            # Basic info
            accession = data["primaryAccession"]
            reviewed = data.get("entryAudit", {}).get("firstPublicDate") is not None
            
            # Gene info
            gene_names = data.get("genes", [])
            gene = gene_names[0].get("geneName", {}).get("value") if gene_names else None
            
            # Protein name
            protein_name = data.get("proteinDescription", {}).get("recommendedName", {}).get("fullName", {}).get("value", "Unknown")
            
            # Organism
            organism = data.get("organism", {}).get("scientificName", "Unknown")
            
            # Sequence
            sequence = data.get("sequence", {})
            length = sequence.get("length", 0)
            seq_value = sequence.get("value", "") if sequence else ""
            
            # Create UniProt info
            uniprot_info = UniProtInfo(
                accession=accession,
                reviewed=reviewed,
                gene=gene,
                protein_name=protein_name,
                organism=organism,
                length=length,
                sequence=seq_value
            )
            
            # Parse GO annotations
            go_annotations = self._parse_go_annotations(data)
            
            return uniprot_info, go_annotations
            
        except Exception as e:
            print(f"Error parsing UniProt data: {e}")
            raise
    
    def _parse_go_annotations(self, data: Dict[str, Any]) -> GOAnnotations:
        """Parse GO terms from UniProt data"""
        go_terms = {
            "biological_process": [],
            "molecular_function": [],
            "cellular_component": []
        }
        
        # Look for GO annotations in dbReferences
        db_refs = data.get("dbReferences", [])
        
        for ref in db_refs:
            if ref.get("type") == "GO":
                go_id = ref.get("id")
                properties = {prop["key"]: prop["value"] for prop in ref.get("properties", [])}
                
                term_name = properties.get("term")
                evidence = properties.get("evidence")
                
                if term_name and go_id:
                    # Determine GO category
                    category = "biological_process"  # Default
                    if term_name.startswith("C:"):
                        category = "cellular_component"
                        term_name = term_name[2:]
                    elif term_name.startswith("F:"):
                        category = "molecular_function"
                        term_name = term_name[2:]
                    elif term_name.startswith("P:"):
                        category = "biological_process"
                        term_name = term_name[2:]
                    
                    go_term = GOTerm(
                        id=go_id,
                        name=term_name,
                        category=category.upper()[:2],  # BP, MF, CC
                        evidence=evidence
                    )
                    
                    go_terms[category].append(go_term)
        
        return GOAnnotations(
            biological_process=go_terms["biological_process"],
            molecular_function=go_terms["molecular_function"],
            cellular_component=go_terms["cellular_component"]
        )
    
    async def _get_taxid_for_species(self, species: str) -> int:
        """Get NCBI taxonomy ID for species name"""
        # Common species mapping
        species_map = {
            "homo sapiens": 9606,
            "human": 9606,
            "mus musculus": 10090,
            "mouse": 10090,
            "rattus norvegicus": 10116,
            "rat": 10116,
            "drosophila melanogaster": 7227,
            "fruit fly": 7227,
            "caenorhabditis elegans": 6239,
            "c. elegans": 6239,
            "saccharomyces cerevisiae": 4932,
            "yeast": 4932,
            "escherichia coli": 83333,
            "e. coli": 83333
        }
        
        return species_map.get(species.lower(), 9606)  # Default to human
