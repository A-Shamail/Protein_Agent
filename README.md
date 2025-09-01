# 🧬 Protein Intelligence Agent

<div align="center">
  <img src="protein.gif" alt="Protein Intelligence Agent Demo" width="800"/>
  
  **AI-powered protein information aggregation that creates beautiful, shareable protein cards with comprehensive biological data.**
  
  *A modern web application that takes a protein/gene name and species, resolves it to UniProt, then aggregates data from multiple trusted biological databases to create a single, comprehensive "Protein Card" - like a Pokemon card for scientists!*
</div>

---

## ✨ Features

<div align="center">
  <img src="protein.gif" alt="Live Demo of Protein Card Creation" width="600"/>
  <p><em>Watch the magic happen: From simple gene name to comprehensive protein intelligence</em></p>
</div>

### 🎯 Core Functionality
- **Smart ID Resolution**: Converts gene names, protein names, or accessions to canonical UniProt IDs
- **Parallel Data Fetching**: Simultaneously queries 6 major biological databases
- **AI-Powered Summaries**: Uses Google Gemini to generate concise functional descriptions
- **Comprehensive Protein Cards**: Professional research-grade UI with all biological data unified

### 📊 Data Sources (All Free APIs)
- **UniProt**: Protein sequences, functions, GO terms, cross-references
- **RCSB PDB**: Experimental protein structures with method/resolution data
- **AlphaFold**: AI-predicted structures with confidence scores + 3D images
- **InterPro**: Protein domains, families, and functional sites
- **STRING**: Protein-protein interaction networks with confidence scores
- **Reactome**: Biological pathways and molecular reactions

### 🎨 UI/UX Highlights
- **Comprehensive Data Display**: All 6 databases unified in one beautiful interface
- **Interactive Elements**: Clickable PDB structures, confidence bars, external links
- **Professional Layout**: Color-coded sections for easy navigation
- **Responsive Design**: Works perfectly on desktop and mobile
- **Export Options**: Copy as JSON, share links, direct database links

### 🧬 What You Get in Each Protein Card

<div align="center">
  <img src="protein.gif" alt="Comprehensive Protein Card Features" width="700"/>
</div>

**From a simple search like "BRCA1" you get:**

🎯 **Function & Role** - AI-generated summary from Gemini analyzing all data sources  
🏗️ **Structural Data** - Complete PDB entries + AlphaFold models with confidence scores  
🤝 **Protein Interactions** - STRING network data with visual confidence indicators  
🛤️ **Biological Pathways** - Reactome pathway participation and functional context  
🔧 **Functional Domains** - InterPro domain annotations with precise positions  
🔗 **External Resources** - Direct links to all source databases  
📊 **Data Provenance** - Transparent tracking of what worked and when

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** for backend
- **Node.js 16+** for frontend  
- **Google Gemini API Key** (free from Google AI Studio)

### 1. Setup Backend
```bash
# Clone the repository
git clone https://github.com/yourusername/protein-agent.git
cd protein-agent

# Setup backend automatically
python setup_backend.py

# Add your API key to backend/.env
# GOOGLE_API_KEY=your_key_here

# Start the backend server
cd backend
python run_server.py
```

The API will be available at `http://localhost:8000` with docs at `/docs`.

### 2. Setup Frontend
```bash
# In a new terminal, setup frontend
python setup_frontend.py

# Start the development server
cd frontend
npm run dev
```

The web app will be available at `http://localhost:3000`.

### 3. Test the Application
```bash
# Test with your existing Gemini setup
cd backend
python -c "
from app.workflows.protein_graph import ProteinWorkflow
from app.models.protein import ProteinSearchRequest
import asyncio

async def test():
    workflow = ProteinWorkflow()
    request = ProteinSearchRequest(query='BRCA1', species='Homo sapiens')
    result = await workflow.process_protein_query(request)
    print(f'✅ Found: {result.uniprot.protein_name}')
    print(f'🎯 Rarity: {result.rarity}')
    print(f'📊 Completeness: {result.completeness_score:.2f}')

asyncio.run(test())
"
```

## 🏗️ Architecture

### Backend (FastAPI + LangGraph)
```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── models/              # Pydantic data models
│   ├── services/            # API clients for each database
│   ├── workflows/           # LangGraph orchestration
│   ├── utils/               # Caching and helpers
│   └── config.py            # Settings and API keys
├── requirements.txt
└── run_server.py           # Development server
```

**LangGraph Workflow:**
1. **Resolver Node**: Query → UniProt accession
2. **Parallel Fetchers**: 6 concurrent API calls (UniProt, PDB, AlphaFold, InterPro, STRING, Reactome)
3. **Aggregator Node**: Merge all data into unified structure
4. **Summarizer Node**: AI-generated functional summary
5. **Validator Node**: Quality checks and final cleanup

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── components/
│   │   ├── ProteinCard.tsx      # Main card component with flip animation
│   │   ├── SearchBar.tsx        # Search interface with examples
│   │   ├── LoadingSpinner.tsx   # Animated loading states
│   │   └── ErrorBoundary.tsx    # Error handling
│   ├── hooks/
│   │   └── useProteinData.ts    # React Query hooks for API calls
│   ├── types/
│   │   └── protein.ts           # TypeScript interfaces
│   └── utils/
│       └── api.ts               # Axios API client
├── tailwind.config.js      # Styling configuration
└── package.json
```

## 🎯 Example Usage

### Search Examples
- **Gene names**: `BRCA1`, `TP53`, `EGFR`, `KRAS`
- **Protein names**: `Tumor suppressor p53`, `Epidermal growth factor receptor`
- **UniProt accessions**: `P04637`, `P00533`, `P38398`

### API Usage
```python
# Direct API call
import requests

response = requests.post('http://localhost:8000/api/protein/search', json={
    "query": "BRCA1",
    "species": "Homo sapiens",
    "include_sequence": False
})

protein_data = response.json()
```

### JSON Output Structure
```json
{
  "query": {"name": "BRCA1", "species": "Homo sapiens"},
  "uniprot": {"accession": "P38398", "reviewed": true, "gene": "BRCA1", "length": 1863},
  "function_summary": "BRCA1 is a tumor suppressor involved in DNA double-strand break repair...",
  "go_annotations": {"biological_process": [...], "molecular_function": [...], "cellular_component": [...]},
  "domains": [{"source": "InterPro", "id": "IPR001357", "name": "BRCT domain"}],
  "structures": {
    "pdb_entries": [{"id": "1T15", "method": "X-ray", "resolution": 1.8}],
    "alphafold": {"model_url": "...", "image_url": "...", "confidence_avg": 85.2}
  },
  "interactions": [{"partner_name": "BARD1", "score": 0.99}],
  "pathways": [{"database": "Reactome", "name": "Homology-directed repair"}],
  "source_links": {"uniprot": "...", "alphafold": "...", "string": "..."},
  "rarity": "gold",
  "completeness_score": 0.95
}
```

## 🛠️ Development

### Adding New Data Sources
1. Create a new service in `backend/app/services/`
2. Add the fetcher to `ProteinWorkflow` parallel tasks
3. Update the data models in `models/protein.py`
4. Add UI components in the frontend

### Environment Variables
```bash
# Backend (.env)
GOOGLE_API_KEY=your_gemini_key
CACHE_ENABLED=true
CACHE_TTL=3600
DEBUG=true

# Frontend (.env)
VITE_API_URL=http://localhost:8000
```

### Testing
```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend tests  
cd frontend
npm test

# Integration test
python test_integration.py
```

## 📈 Performance & Caching

- **Response Time**: Typically 10-30 seconds for comprehensive data
- **Caching**: File-based cache with configurable TTL (default 1 hour)
- **Rate Limiting**: Respects API limits of all data sources
- **Parallel Processing**: 6 simultaneous API calls via asyncio

## 🔧 Deployment

### Production Backend
```bash
# Using Docker
docker build -t protein-agent-backend backend/
docker run -p 8000:8000 -e GOOGLE_API_KEY=your_key protein-agent-backend

# Using Railway/Render
railway up
```

### Production Frontend
```bash
# Build for production
cd frontend
npm run build

# Deploy to Vercel/Netlify
vercel --prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Data Sources**: UniProt, RCSB PDB, AlphaFold (EBI), InterPro, STRING, Reactome
- **AI**: Google Gemini for intelligent summaries
- **Framework**: FastAPI, LangGraph, React, Tailwind CSS
- **Inspiration**: Pokemon cards for making complex data accessible and fun!

## 📊 Resume-Ready Bullets

- Built a **Protein Intelligence Agent** that resolves gene/protein queries to UniProt and aggregates domains (InterPro), structures (PDB/AlphaFold), interactions (STRING), and pathways (Reactome) into a single card with **source-linked citations**
- Implemented **parallel API tooling** (LangGraph + FastAPI) with robust ID mapping, species disambiguation, and JSON schema validation
- Created **Pokemon-card-style UI** with flip animations, rarity systems, and embedded 3D protein structure images using React + TypeScript

---

**Made with ❤️ for the scientific community**