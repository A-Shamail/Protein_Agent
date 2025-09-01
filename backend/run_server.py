#!/usr/bin/env python3
"""
Development server runner for Protein Intelligence Agent
"""

import uvicorn
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.config import settings

if __name__ == "__main__":
    print("🧬 Starting Protein Intelligence Agent API Server...")
    print(f"📡 Server will be available at: http://{settings.HOST}:{settings.PORT}")
    print(f"📖 API Documentation: http://{settings.HOST}:{settings.PORT}/docs")
    print(f"🔧 Debug mode: {settings.DEBUG}")
    print(f"💾 Cache enabled: {settings.CACHE_ENABLED}")
    
    if not settings.GOOGLE_API_KEY:
        print("⚠️  WARNING: GOOGLE_API_KEY not set! Please check your .env file.")
    else:
        print("✅ Google Gemini API key configured")
    
    print("\n" + "="*50)
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        reload_dirs=["app"] if settings.DEBUG else None,
        log_level="info"
    )
