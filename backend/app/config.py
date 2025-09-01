import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # AI API
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    
    # App settings
    CACHE_ENABLED: bool = os.getenv("CACHE_ENABLED", "true").lower() == "true"
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "3600"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # API Rate limiting
    MAX_REQUESTS_PER_MINUTE: int = 60
    
    # Default species (Human)
    DEFAULT_SPECIES: str = "Homo sapiens"
    DEFAULT_TAXID: int = 9606

settings = Settings()
