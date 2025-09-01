import httpx
from typing import Optional, Dict, Any
from ..models.protein import AlphaFoldModel

class AlphaFoldService:
    def __init__(self):
        self.api_url = "https://alphafold.ebi.ac.uk/api/prediction"
        self.files_url = "https://alphafold.ebi.ac.uk/files"
        self.timeout = 30.0
    
    async def fetch_alphafold_model(self, uniprot_accession: str) -> Optional[AlphaFoldModel]:
        """Fetch AlphaFold model information for UniProt accession"""
        try:
            # Check if model exists
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.api_url}/{uniprot_accession}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data:  # Model exists
                        return self._parse_alphafold_data(uniprot_accession, data[0])
                else:
                    print(f"No AlphaFold model found for {uniprot_accession}")
                    return None
                    
        except Exception as e:
            print(f"Error fetching AlphaFold data: {e}")
            return None
    
    def _parse_alphafold_data(self, uniprot_accession: str, data: Dict[str, Any]) -> AlphaFoldModel:
        """Parse AlphaFold API response"""
        try:
            # Extract confidence information
            confidence_avg = None
            confidence_ranges = {}
            
            if "confidenceAvgLocalScore" in data:
                confidence_avg = data["confidenceAvgLocalScore"]
            
            # Calculate confidence score ranges (if available)
            if "confidenceScore" in data:
                scores = data["confidenceScore"]
                if scores:
                    total = len(scores)
                    very_high = sum(1 for s in scores if s >= 90)
                    confident = sum(1 for s in scores if 70 <= s < 90)
                    low = sum(1 for s in scores if 50 <= s < 70)
                    very_low = sum(1 for s in scores if s < 50)
                    
                    confidence_ranges = {
                        "very_high": round(very_high / total * 100, 1),
                        "confident": round(confident / total * 100, 1),
                        "low": round(low / total * 100, 1),
                        "very_low": round(very_low / total * 100, 1)
                    }
            
            # Generate file URLs
            model_url = f"{self.files_url}/AF-{uniprot_accession}-F1-model_v4.cif"
            pdb_url = f"{self.files_url}/AF-{uniprot_accession}-F1-model_v4.pdb"
            image_url = f"{self.files_url}/AF-{uniprot_accession}-F1-model_v4.png"
            
            return AlphaFoldModel(
                model_url=model_url,
                pdb_url=pdb_url,
                image_url=image_url,
                confidence_avg=confidence_avg,
                confidence_ranges=confidence_ranges
            )
            
        except Exception as e:
            print(f"Error parsing AlphaFold data: {e}")
            # Return basic model info even if parsing fails
            return AlphaFoldModel(
                model_url=f"{self.files_url}/AF-{uniprot_accession}-F1-model_v4.cif",
                pdb_url=f"{self.files_url}/AF-{uniprot_accession}-F1-model_v4.pdb",
                image_url=f"{self.files_url}/AF-{uniprot_accession}-F1-model_v4.png",
                confidence_avg=None,
                confidence_ranges=None
            )
