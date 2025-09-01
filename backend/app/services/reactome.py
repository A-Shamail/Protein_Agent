import httpx
from typing import List, Dict, Any
from ..models.protein import Pathway

class ReactomeService:
    def __init__(self):
        self.api_url = "https://reactome.org/ContentService"
        self.timeout = 30.0
    
    async def fetch_pathways(self, uniprot_accession: str) -> List[Pathway]:
        """Fetch Reactome pathways for UniProt accession"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Try multiple search strategies for Reactome
                search_strategies = [
                    # Strategy 1: Search by name first
                    f"{self.api_url}/data/query/{uniprot_accession}?species=9606",
                    # Strategy 2: Try with UniProt prefix
                    f"{self.api_url}/data/query/UniProt:{uniprot_accession}",
                    # Strategy 3: Search query endpoint
                    f"{self.api_url}/search/query?query={uniprot_accession}&cluster=true",
                    # Strategy 4: Interactors endpoint
                    f"{self.api_url}/data/interactors/static/protein/{uniprot_accession}",
                ]
                
                response = None
                working_endpoint = None
                
                for endpoint in search_strategies:
                    try:
                        headers = {'Accept': 'application/json'}
                        response = await client.get(endpoint, headers=headers)
                        if response.status_code == 200:
                            print(f"✅ Reactome success: {endpoint}")
                            working_endpoint = endpoint
                            break
                        else:
                            print(f"❌ Reactome {response.status_code}: {endpoint}")
                    except Exception as e:
                        print(f"❌ Reactome error: {endpoint} - {e}")
                        continue
                
                if response and response.status_code == 200:
                    data = response.json()
                    return self._parse_reactome_data(data)
                else:
                    print(f"Failed to fetch Reactome data: {response.status_code if response else 'No response'}")
                    return []
                    
        except Exception as e:
            print(f"Error fetching Reactome data: {e}")
            return []
    
    def _parse_reactome_data(self, data: List[Dict[str, Any]]) -> List[Pathway]:
        """Parse Reactome API response"""
        pathways = []
        
        try:
            for pathway_data in data:
                if pathway_data.get("schemaClass") == "Pathway":
                    pathway_id = pathway_data.get("stId", "")
                    pathway_name = pathway_data.get("displayName", "")
                    
                    # Build pathway URL
                    pathway_url = f"https://reactome.org/content/detail/{pathway_id}" if pathway_id else None
                    
                    pathway = Pathway(
                        database="Reactome",
                        id=pathway_id,
                        name=pathway_name,
                        url=pathway_url
                    )
                    
                    pathways.append(pathway)
            
            # Sort by name for consistent ordering
            pathways.sort(key=lambda x: x.name)
            
            return pathways
            
        except Exception as e:
            print(f"Error parsing Reactome data: {e}")
            return []
