from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import asyncio
from typing import Dict, Any

from .models.protein import ProteinSearchRequest, ProteinSearchResponse
from .workflows.protein_graph import ProteinWorkflow
from .config import settings

# Create FastAPI app
app = FastAPI(
    title="Protein Intelligence Agent",
    description="AI-powered protein information aggregation service",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize workflow
protein_workflow = ProteinWorkflow()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Protein Intelligence Agent API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {
            "gemini_api": bool(settings.GOOGLE_API_KEY),
            "cache": settings.CACHE_ENABLED
        }
    }

@app.get("/api/sources")
async def get_sources():
    """Get information about available data sources"""
    return {
        "sources": [
            {
                "name": "UniProt",
                "description": "Universal Protein Resource",
                "url": "https://www.uniprot.org/",
                "data_types": ["basic_info", "function", "go_terms", "sequence"]
            },
            {
                "name": "RCSB PDB",
                "description": "Protein Data Bank",
                "url": "https://www.rcsb.org/",
                "data_types": ["experimental_structures", "methods", "resolution"]
            },
            {
                "name": "AlphaFold",
                "description": "AI-predicted protein structures",
                "url": "https://alphafold.ebi.ac.uk/",
                "data_types": ["predicted_structures", "confidence_scores", "3d_models"]
            },
            {
                "name": "InterPro",
                "description": "Protein families and domains",
                "url": "https://www.ebi.ac.uk/interpro/",
                "data_types": ["domains", "families", "functional_sites"]
            },
            {
                "name": "STRING",
                "description": "Protein interaction networks",
                "url": "https://string-db.org/",
                "data_types": ["protein_interactions", "functional_associations"]
            },
            {
                "name": "Reactome",
                "description": "Biological pathways",
                "url": "https://reactome.org/",
                "data_types": ["pathways", "reactions", "biological_processes"]
            }
        ]
    }

@app.post("/api/protein/search", response_model=ProteinSearchResponse)
async def search_protein(request: ProteinSearchRequest):
    """
    Main endpoint for protein intelligence search
    
    Takes a protein/gene name and species, returns comprehensive protein card data
    """
    start_time = time.time()
    
    try:
        # Validate request
        if not request.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # Process the protein query through our workflow
        protein_report = await protein_workflow.process_protein_query(request)
        
        if not protein_report:
            raise HTTPException(
                status_code=404, 
                detail=f"No protein found for query: {request.query}"
            )
        
        processing_time = time.time() - start_time
        
        return ProteinSearchResponse(
            success=True,
            data=protein_report,
            error=None,
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time = time.time() - start_time
        
        return ProteinSearchResponse(
            success=False,
            data=None,
            error=str(e),
            processing_time=processing_time
        )

@app.get("/api/protein/{uniprot_id}")
async def get_protein_by_id(uniprot_id: str):
    """Get protein data by UniProt accession ID"""
    try:
        # Create a request with the UniProt ID directly
        request = ProteinSearchRequest(
            query=uniprot_id,
            species="Homo sapiens"  # Default, but will be overridden by UniProt data
        )
        
        protein_report = await protein_workflow.process_protein_query(request)
        
        if not protein_report:
            raise HTTPException(
                status_code=404,
                detail=f"No protein found for UniProt ID: {uniprot_id}"
            )
        
        return {"success": True, "data": protein_report}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/protein/{uniprot_id}/image")
async def get_protein_image(uniprot_id: str):
    """Proxy protein structure image to bypass CORS"""
    try:
        import httpx
        from fastapi.responses import Response
        
        alphafold_url = f"https://alphafold.ebi.ac.uk/files/AF-{uniprot_id}-F1-model_v4.png"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(alphafold_url)
            
            if response.status_code == 200:
                return Response(
                    content=response.content,
                    media_type="image/png",
                    headers={
                        "Cache-Control": "public, max-age=86400",  # Cache for 24 hours
                        "Access-Control-Allow-Origin": "*"
                    }
                )
            else:
                # Return a fallback if AlphaFold image not found
                raise HTTPException(status_code=404, detail="Structure image not found")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Resource not found", "detail": str(exc.detail) if hasattr(exc, 'detail') else "Not found"}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": "An unexpected error occurred"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
