import React, { useState } from 'react';
import { Search, Loader2, Dna } from 'lucide-react';
import { motion } from 'framer-motion';

interface SearchBarProps {
  onSearch: (query: string, species: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const COMMON_SPECIES = [
  { name: 'Homo sapiens', label: 'Human', taxid: 9606 },
  { name: 'Mus musculus', label: 'Mouse', taxid: 10090 },
  { name: 'Rattus norvegicus', label: 'Rat', taxid: 10116 },
  { name: 'Drosophila melanogaster', label: 'Fruit Fly', taxid: 7227 },
  { name: 'Caenorhabditis elegans', label: 'C. elegans', taxid: 6239 },
  { name: 'Saccharomyces cerevisiae', label: 'Yeast', taxid: 4932 },
];

const EXAMPLE_QUERIES = [
  'BRCA1',
  'TP53',
  'EGFR',
  'KRAS',
  'MYC',
  'PTEN'
];

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  isLoading = false, 
  placeholder = "Enter protein or gene name (e.g., BRCA1, TP53, EGFR)"
}) => {
  const [query, setQuery] = useState('');
  const [species, setSpecies] = useState('Homo sapiens');
  const [showExamples, setShowExamples] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim(), species);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    setShowExamples(false);
    onSearch(example, species);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4"
        >
          <Dna className="w-8 h-8 text-white" />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-gray-900 mb-2"
        >
          Protein Intelligence Agent
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-gray-600"
        >
          Create beautiful protein cards with comprehensive biological data
        </motion.p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-gray-400" />
            )}
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="search-bar pl-12 pr-4"
            onFocus={() => setShowExamples(true)}
            onBlur={() => setTimeout(() => setShowExamples(false), 200)}
          />
          
          {/* Examples Dropdown */}
          {showExamples && query.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
            >
              <div className="p-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-700">Try these examples:</p>
              </div>
              <div className="p-2">
                {EXAMPLE_QUERIES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => handleExampleClick(example)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Species Selection and Search Button */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-2">
              Species
            </label>
            <select
              id="species"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 bg-white"
            >
              {COMMON_SPECIES.map((spec) => (
                <option key={spec.taxid} value={spec.name}>
                  {spec.label} ({spec.name})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <motion.button
              type="submit"
              disabled={!query.trim() || isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl 
                       hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search
                </>
              )}
            </motion.button>
          </div>
        </div>
      </form>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
      >
        <p className="text-sm text-blue-800">
          <strong>Pro tip:</strong> Search using gene names (BRCA1), protein names (Tumor suppressor p53), 
          or UniProt accessions (P04637). Results include structure images, domains, interactions, and pathways.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default SearchBar;
