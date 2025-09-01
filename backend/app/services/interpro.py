import httpx
from typing import List, Dict, Any
from ..models.protein import Domain

class InterProService:
    def __init__(self):
        self.api_url = "https://www.ebi.ac.uk/interpro/api"
        self.timeout = 30.0
    
    async def fetch_domains(self, uniprot_accession: str) -> List[Domain]:
        """Fetch InterPro domain annotations for UniProt accession"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.api_url}/protein/UniProt/{uniprot_accession}/entry/interpro"
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return self._parse_interpro_data(data)
                else:
                    print(f"Failed to fetch InterPro data: {response.status_code}")
                    return []
                    
        except Exception as e:
            print(f"Error fetching InterPro data: {e}")
            return []
    
    def _parse_interpro_data(self, data: Dict[str, Any]) -> List[Domain]:
        """Parse InterPro API response"""
        domains = []
        
        try:
            results = data.get("results", [])
            
            for result in results:
                metadata = result.get("metadata", {})
                
                # Basic domain info
                domain_id = metadata.get("accession", "")
                domain_name = metadata.get("name", "")
                domain_type = metadata.get("type", {}).get("type", "Unknown")
                description = metadata.get("description", "")
                
                # Get location information
                proteins = result.get("proteins", [])
                start_pos = None
                end_pos = None
                
                if proteins:
                    entry_protein_locations = proteins[0].get("entry_protein_locations", [])
                    if entry_protein_locations:
                        fragments = entry_protein_locations[0].get("fragments", [])
                        if fragments:
                            start_pos = fragments[0].get("start")
                            end_pos = fragments[0].get("end")
                
                # Determine source (InterPro entries can come from various databases)
                source = "InterPro"
                if domain_type in ["Family", "Domain", "Repeat"]:
                    source = "InterPro"
                elif "PF" in domain_id:
                    source = "Pfam"
                
                domain = Domain(
                    source=source,
                    id=domain_id,
                    name=domain_name,
                    description=description[:200] if description else None,  # Truncate long descriptions
                    start=start_pos,
                    end=end_pos
                )
                
                domains.append(domain)
            
            return domains
            
        except Exception as e:
            print(f"Error parsing InterPro data: {e}")
            return []
