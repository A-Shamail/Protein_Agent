import httpx
from typing import Optional, List, Dict, Any
from ..models.protein import PDBEntry

class PDBService:
    def __init__(self):
        self.search_url = "https://search.rcsb.org/rcsbsearch/v2/query"
        self.data_url = "https://data.rcsb.org/rest/v1/core"
        self.timeout = 30.0
    
    async def fetch_pdb_structures(self, uniprot_accession: str) -> List[PDBEntry]:
        """Fetch PDB structures for a UniProt accession"""
        try:
            # Search for PDB entries by UniProt accession
            pdb_ids = await self._search_pdb_by_uniprot(uniprot_accession)
            
            if not pdb_ids:
                return []
            
            # Get detailed info for each PDB entry
            entries = []
            for pdb_id in pdb_ids[:10]:  # Limit to top 10 structures
                entry_info = await self._get_pdb_entry_info(pdb_id)
                if entry_info:
                    entries.append(entry_info)
            
            return entries
            
        except Exception as e:
            print(f"Error fetching PDB data: {e}")
            return []
    
    async def _search_pdb_by_uniprot(self, uniprot_accession: str) -> List[str]:
        """Search PDB database for structures containing UniProt accession"""
        try:
            query = {
                "query": {
                    "type": "terminal",
                    "service": "text",
                    "parameters": {
                        "attribute": "rcsb_polymer_entity_container_identifiers.reference_sequence_identifiers.database_accession",
                        "operator": "exact_match",
                        "value": uniprot_accession
                    }
                },
                "return_type": "entry",
                "request_options": {
                    "return_all_hits": True
                }
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.search_url,
                    json=query,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    result_set = data.get("result_set", [])
                    return [item["identifier"] for item in result_set]
                else:
                    print(f"PDB search failed: {response.status_code}")
                    return []
                    
        except Exception as e:
            print(f"Error searching PDB: {e}")
            return []
    
    async def _get_pdb_entry_info(self, pdb_id: str) -> Optional[PDBEntry]:
        """Get detailed information for a specific PDB entry"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.data_url}/entry/{pdb_id}")
                
                if response.status_code == 200:
                    data = response.json()
                    return self._parse_pdb_entry(pdb_id, data)
                else:
                    print(f"Failed to get PDB entry {pdb_id}: {response.status_code}")
                    return None
                    
        except Exception as e:
            print(f"Error getting PDB entry info: {e}")
            return None
    
    def _parse_pdb_entry(self, pdb_id: str, data: Dict[str, Any]) -> PDBEntry:
        """Parse PDB entry data"""
        try:
            # Experimental method
            exp_methods = data.get("exptl", [])
            method = exp_methods[0].get("method", "Unknown") if exp_methods else "Unknown"
            
            # Resolution
            resolution = None
            refine = data.get("refine", [])
            if refine and method.upper() in ["X-RAY DIFFRACTION", "NEUTRON DIFFRACTION"]:
                resolution = refine[0].get("ls_d_res_high")
            
            # Chains (simplified - just get entity IDs)
            entities = data.get("rcsb_entry_info", {}).get("polymer_entity_count_protein", 0)
            chains = [chr(65 + i) for i in range(min(entities, 26))]  # A, B, C, etc.
            
            return PDBEntry(
                id=pdb_id.upper(),
                method=method,
                resolution=float(resolution) if resolution else None,
                chains=chains,
                coverage="Unknown"  # Would need SIFTS data for accurate coverage
            )
            
        except Exception as e:
            print(f"Error parsing PDB entry: {e}")
            return PDBEntry(
                id=pdb_id.upper(),
                method="Unknown",
                resolution=None,
                chains=[],
                coverage="Unknown"
            )
