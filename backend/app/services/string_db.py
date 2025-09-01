import httpx
from typing import List, Dict, Any
from ..models.protein import Interaction

class STRINGService:
    def __init__(self):
        self.api_url = "https://string-db.org/api"
        self.timeout = 30.0
    
    async def fetch_interactions(self, uniprot_accession: str, taxid: int = 9606, limit: int = 10) -> List[Interaction]:
        """Fetch protein interactions from STRING database"""
        try:
            # Get STRING identifier first
            string_id = await self._get_string_id(uniprot_accession, taxid)
            
            if not string_id:
                print(f"No STRING ID found for {uniprot_accession}")
                return []
            
            # Get interaction partners
            interactions = await self._get_interactions(string_id, limit)
            return interactions
            
        except Exception as e:
            print(f"Error fetching STRING interactions: {e}")
            return []
    
    async def _get_string_id(self, uniprot_accession: str, taxid: int) -> str:
        """Resolve UniProt accession to STRING identifier"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.api_url}/tsv/get_string_ids",
                    data={
                        "identifiers": uniprot_accession,
                        "species": taxid,
                        "limit": 1,
                        "echo_query": 1
                    }
                )
                
                if response.status_code == 200:
                    lines = response.text.strip().split('\n')
                    if len(lines) > 1:  # Skip header
                        data = lines[1].split('\t')
                        if len(data) >= 2:
                            return data[2]  # STRING ID is in 3rd column
                
                return ""
                
        except Exception as e:
            print(f"Error resolving STRING ID: {e}")
            return ""
    
    async def _get_interactions(self, string_id: str, limit: int) -> List[Interaction]:
        """Get interaction partners for STRING ID"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.api_url}/tsv/interaction_partners",
                    data={
                        "identifiers": string_id,
                        "required_score": 400,  # Medium confidence
                        "limit": limit
                    }
                )
                
                if response.status_code == 200:
                    return self._parse_interactions(response.text)
                else:
                    print(f"Failed to get STRING interactions: {response.status_code}")
                    return []
                    
        except Exception as e:
            print(f"Error getting STRING interactions: {e}")
            return []
    
    def _parse_interactions(self, response_text: str) -> List[Interaction]:
        """Parse STRING interactions response"""
        interactions = []
        
        try:
            lines = response_text.strip().split('\n')
            
            # Skip header line
            for line in lines[1:]:
                if not line:
                    continue
                    
                parts = line.split('\t')
                if len(parts) >= 4:
                    partner_id = parts[1]  # stringId_B
                    partner_name = parts[2] if len(parts) > 2 else partner_id  # preferredName_B
                    score = float(parts[5]) / 1000.0 if len(parts) > 5 else 0.0  # Combined score (normalized)
                    
                    # Extract gene name from STRING ID (format: taxid.gene)
                    if '.' in partner_name:
                        partner_name = partner_name.split('.')[1]
                    
                    interaction = Interaction(
                        partner_id=partner_id,
                        partner_name=partner_name,
                        score=score,
                        source="STRING"
                    )
                    
                    interactions.append(interaction)
            
            # Sort by score (highest first)
            interactions.sort(key=lambda x: x.score, reverse=True)
            
            return interactions
            
        except Exception as e:
            print(f"Error parsing STRING interactions: {e}")
            return []
