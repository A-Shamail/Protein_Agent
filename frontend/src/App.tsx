import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, Github, ExternalLink } from 'lucide-react';

import ErrorBoundary from './components/ErrorBoundary';
import SearchBar from './components/SearchBar';
import ProteinCard from './components/ProteinCard';
import LoadingSpinner from './components/LoadingSpinner';
import { useProteinSearch, useHealthCheck } from './hooks/useProteinData';
import { ProteinReport } from './types/protein';

const App: React.FC = () => {
  const [searchResult, setSearchResult] = useState<ProteinReport | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const proteinSearch = useProteinSearch();
  const { data: healthData } = useHealthCheck();



  const handleSearch = async (query: string, species: string) => {
    setSearchError(null);
    setSearchResult(null);
    
    try {
      const result = await proteinSearch.mutateAsync({
        query,
        species,
        include_sequence: false
      });
      
      if (result.success && result.data) {
        setSearchResult(result.data);
      } else {
        setSearchError(result.error || 'No protein found for your search');
      }
    } catch (error: any) {
      setSearchError(error.response?.data?.detail || error.message || 'Search failed');
    }
  };

  const handleNewSearch = () => {
    setSearchResult(null);
    setSearchError(null);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={handleNewSearch}
                className="flex items-center gap-2 text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors"
              >
                🧬 Protein Intelligence Agent
              </button>
              
              <div className="flex items-center gap-4">
                {/* Health Status */}
                {healthData && (
                  <div className="flex items-center gap-2 text-sm">
                    {healthData.services?.gemini_api ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-gray-600">
                      {healthData.services?.gemini_api ? 'Online' : 'Offline'}
                    </span>
                  </div>
                )}
                
                {/* GitHub Link */}
                <a
                  href="https://github.com/yourusername/protein-agent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span className="text-sm">Code</span>
                </a>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            {!searchResult && !proteinSearch.isPending ? (
              /* Search Interface */
              <motion.div
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-4xl mx-auto"
              >
                <SearchBar
                  onSearch={handleSearch}
                  isLoading={proteinSearch.isPending}
                />
                
                {/* Error Display */}
                {searchError && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <h3 className="font-medium text-red-900">Search Error</h3>
                    </div>
                    <p className="text-red-700 mt-1">{searchError}</p>
                    <p className="text-red-600 text-sm mt-2">
                      Try a different protein name or check the spelling. Common examples: BRCA1, TP53, EGFR
                    </p>
                  </motion.div>
                )}

                {/* Examples Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-12"
                >
                  <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
                    What You'll Get
                  </h2>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                        🧬
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Basic Information</h3>
                      <p className="text-gray-600 text-sm">
                        UniProt accession, protein name, organism, sequence length, and review status
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                        🔬
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">3D Structures</h3>
                      <p className="text-gray-600 text-sm">
                        AlphaFold predictions and experimental PDB structures with confidence scores
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                        🎯
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Functional Data</h3>
                      <p className="text-gray-600 text-sm">
                        Domains, interactions, pathways, and AI-generated functional summaries
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : proteinSearch.isPending ? (
              /* Loading State */
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingSpinner
                  message="Building your protein card..."
                  details={[
                    "Resolving protein identity",
                    "Fetching structure data",
                    "Collecting interaction networks",
                    "Generating AI summary"
                  ]}
                />
              </motion.div>
            ) : searchResult ? (
              /* Results Display */
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Debug info */}
                <div className="bg-green-100 p-4 rounded-lg">
                  <p className="text-green-800">✅ Protein data loaded: {searchResult.uniprot.protein_name}</p>
                  <p className="text-green-600 text-sm">UniProt: {searchResult.uniprot.accession}</p>
                </div>
                {/* Results Header */}
                <div className="text-center">
                  <button
                    onClick={handleNewSearch}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                  >
                    ← New Search
                  </button>
                </div>

                {/* Comprehensive Protein Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-4xl mx-auto overflow-hidden">
                  {/* Header Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
                    <div className="flex items-start gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h1 className="text-2xl font-bold text-gray-900">
                            {searchResult.uniprot.gene || searchResult.query.name.toUpperCase()}
                          </h1>
                          {searchResult.uniprot.reviewed && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              ✓ Reviewed
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 text-lg mb-1">{searchResult.uniprot.protein_name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>🧬 {searchResult.uniprot.organism}</span>
                          <span>🆔 {searchResult.uniprot.accession}</span>
                          <span>📏 {searchResult.uniprot.length} amino acids</span>
                          <span>📊 {Math.round(searchResult.completeness_score * 100)}% complete</span>
                        </div>
                      </div>
                      
                      {/* AlphaFold Structure */}
                      {searchResult.structures.alphafold && (
                        <div className="w-32 h-32 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-shrink-0">
                          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-center">
                            <div>
                              <div className="text-2xl mb-1">🧬</div>
                              <div className="text-xs text-gray-700 font-medium mb-1">AlphaFold</div>
                              <a
                                href={searchResult.source_links.alphafold}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                              >
                                View 3D
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Sections */}
                  <div className="p-6 space-y-6">
                    {/* Function Summary */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        🎯 Function & Role
                      </h3>
                      <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                        {searchResult.function_summary}
                      </p>
                    </div>

                    {/* Structural Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        🏗️ Structural Data
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* PDB Structures */}
                        {searchResult.structures.pdb_entries.length > 0 && (
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-2">
                              Experimental Structures ({searchResult.structures.pdb_entries.length})
                            </h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {searchResult.structures.pdb_entries.slice(0, 8).map((pdb, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <a
                                    href={`https://www.rcsb.org/structure/${pdb.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-blue-700 hover:text-blue-900 underline"
                                  >
                                    {pdb.id}
                                  </a>
                                  <span className="text-gray-600">{pdb.method}</span>
                                  {pdb.resolution && (
                                    <span className="text-gray-500 text-xs">{pdb.resolution}Å</span>
                                  )}
                                </div>
                              ))}
                              {searchResult.structures.pdb_entries.length > 8 && (
                                <p className="text-xs text-gray-500">
                                  +{searchResult.structures.pdb_entries.length - 8} more structures
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* AlphaFold Model */}
                        {searchResult.structures.alphafold && (
                          <div className="bg-green-50 rounded-lg p-4">
                            <h4 className="font-medium text-green-900 mb-2">
                              AI-Predicted Structure
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">AlphaFold Model</span>
                                <span className="text-green-700 font-medium">Available</span>
                              </div>
                              {searchResult.structures.alphafold.confidence_avg && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700">Avg. Confidence</span>
                                  <span className="text-green-700">
                                    {searchResult.structures.alphafold.confidence_avg.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                              <a
                                href={searchResult.structures.alphafold.pdb_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900"
                              >
                                Download PDB ↗
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Protein Interactions */}
                    {searchResult.interactions.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          🤝 Protein Interactions ({searchResult.interactions.length})
                        </h3>
                        <div className="bg-orange-50 rounded-lg p-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-orange-900 mb-2">Top Interaction Partners</h4>
                              <div className="space-y-2">
                                {searchResult.interactions.slice(0, 6).map((interaction, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700 font-medium">
                                      {interaction.partner_name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-orange-500 h-2 rounded-full"
                                          style={{ width: `${interaction.score * 100}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs text-gray-500 w-8">
                                        {Math.round(interaction.score * 100)}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p className="mb-2">
                                <strong>Data Source:</strong> STRING Database
                              </p>
                              <p className="mb-2">
                                <strong>Network Analysis:</strong> Functional protein associations
                              </p>
                              <a
                                href={searchResult.source_links.string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-700 hover:text-orange-900 underline"
                              >
                                View full interaction network ↗
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Biological Pathways */}
                    {searchResult.pathways.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          🛤️ Biological Pathways ({searchResult.pathways.length})
                        </h3>
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {searchResult.pathways.map((pathway, idx) => (
                              <div key={idx} className="bg-white rounded p-3 border border-purple-200">
                                <h4 className="font-medium text-purple-900 text-sm mb-1">
                                  {pathway.name}
                                </h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">{pathway.database}</span>
                                  {pathway.url && (
                                    <a
                                      href={pathway.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-purple-700 hover:text-purple-900"
                                    >
                                      View ↗
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Domains & Features */}
                    {searchResult.domains.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          🔧 Functional Domains ({searchResult.domains.length})
                        </h3>
                        <div className="bg-indigo-50 rounded-lg p-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            {searchResult.domains.map((domain, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 border border-indigo-200">
                                <h4 className="font-medium text-indigo-900 mb-1">{domain.name}</h4>
                                <div className="text-xs text-gray-600 mb-2">
                                  {domain.source} • {domain.id}
                                  {domain.start && domain.end && (
                                    <span> • Position {domain.start}-{domain.end}</span>
                                  )}
                                </div>
                                {domain.description && (
                                  <p className="text-sm text-gray-700">{domain.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Data Sources & Links */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        🔗 External Resources
                      </h3>
                      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {Object.entries(searchResult.source_links).map(([source, url]) => (
                          url && (
                            <a
                              key={source}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                            >
                              {source.charAt(0).toUpperCase() + source.slice(1)}
                            </a>
                          )
                        ))}
                      </div>
                    </div>

                    {/* Data Provenance */}
                    <div className="border-t border-gray-200 pt-4">
                      <details className="group">
                        <summary className="flex items-center justify-between cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                          <span>📊 Data Sources & Retrieval Info</span>
                          <span className="group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="mt-3 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {searchResult.provenance.map((prov, idx) => (
                            <div key={idx} className="bg-gray-50 rounded p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{prov.source}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  prov.status === 'success' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {prov.status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(prov.retrieved).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  </div>
                </div>


                {/* Processing Time */}
                {proteinSearch.data?.processing_time && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      Processed in {proteinSearch.data.processing_time.toFixed(2)}s
                    </div>
                  </div>
                )}

                {/* Share Section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-lg p-6 border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-900 mb-3">Share & Export</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}?protein=${searchResult.uniprot.accession}`;
                        navigator.clipboard.writeText(url);
                      }}
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(searchResult, null, 2));
                      }}
                      className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors text-sm"
                    >
                      Copy JSON
                    </button>
                    <a
                      href={searchResult.source_links.uniprot}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                    >
                      View in UniProt
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-sm text-gray-600">
              <p>
                Powered by{' '}
                <a href="https://www.uniprot.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  UniProt
                </a>
                {', '}
                <a href="https://alphafold.ebi.ac.uk/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  AlphaFold
                </a>
                {', '}
                <a href="https://string-db.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  STRING
                </a>
                {', '}
                <a href="https://reactome.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Reactome
                </a>
                {' and '}
                <a href="https://www.ebi.ac.uk/interpro/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  InterPro
                </a>
              </p>
              <p className="mt-2">
                Built with FastAPI, LangGraph, React, and Gemini AI
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
