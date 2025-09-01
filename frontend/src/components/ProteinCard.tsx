import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Copy, 
  ExternalLink, 
  Dna, 
  Microscope, 
  Network, 
  MapPin,
  Info,
  ChevronRight,
  Download
} from 'lucide-react';
import { ProteinReport } from '../types/protein';

interface ProteinCardProps {
  data: ProteinReport;
  className?: string;
}

const ProteinCard: React.FC<ProteinCardProps> = ({ data, className = '' }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const getRarityStars = (rarity: string) => {
    const count = rarity === 'gold' ? 3 : rarity === 'silver' ? 2 : 1;
    return Array.from({ length: 3 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < count ? 'fill-current text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'gold': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'silver': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'bronze': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const copyAsJSON = () => {
    copyToClipboard(JSON.stringify(data, null, 2));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full max-w-2xl mx-auto ${className}`}
    >
      <div className={`protein-card protein-card-${data.rarity} relative overflow-hidden`}>
        <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
          {/* FRONT OF CARD */}
          <div className="flip-card-front p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {data.uniprot.gene || data.query.name.toUpperCase()}
                  </h1>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRarityColor(data.rarity)}`}>
                    {data.rarity.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-1">{data.uniprot.protein_name}</p>
                <p className="text-gray-500 text-xs">
                  {data.uniprot.organism} • {data.uniprot.accession}
                </p>
                
                <div className="flex items-center gap-1 mt-2">
                  {getRarityStars(data.rarity)}
                  <span className="text-xs text-gray-500 ml-1">
                    {Math.round(data.completeness_score * 100)}% complete
                  </span>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                  title="Flip card"
                >
                  <Info className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={copyAsJSON}
                  className="p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                  title="Copy as JSON"
                >
                  <Copy className="w-4 h-4 text-green-600" />
                </button>
              </div>
            </div>

            {/* AlphaFold Structure Image */}
            {data.structures.alphafold && (
              <div className="mb-4 bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Microscope className="w-4 h-4" />
                  3D Structure
                </h3>
                <div className="relative">
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                      <div className="loading-spinner"></div>
                    </div>
                  )}
                  <img
                    src={data.structures.alphafold.image_url}
                    alt={`${data.uniprot.gene} structure`}
                    className={`w-full h-48 object-contain rounded-lg ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageError(true);
                      setImageLoading(false);
                    }}
                  />
                  {imageError && (
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500 text-sm">Structure image unavailable</p>
                    </div>
                  )}
                </div>
                {data.structures.alphafold.confidence_avg && (
                  <p className="text-xs text-gray-600 mt-2">
                    Avg. Confidence: {data.structures.alphafold.confidence_avg.toFixed(1)}%
                  </p>
                )}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Dna className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Length</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{data.uniprot.length} aa</p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Network className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Partners</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{data.interactions.length}</p>
              </div>
            </div>

            {/* Quick Info Sections */}
            <div className="space-y-3">
              {/* Domains */}
              {data.domains.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Domains</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.domains.slice(0, 3).map((domain, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                      >
                        {domain.name}
                      </span>
                    ))}
                    {data.domains.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{data.domains.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Top Interactions */}
              {data.interactions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Partners</h4>
                  <div className="space-y-1">
                    {data.interactions.slice(0, 2).map((interaction, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{interaction.partner_name}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {Math.round(interaction.score * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Flip hint */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsFlipped(true)}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span>View detailed information</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* BACK OF CARD */}
          <div className="flip-card-back p-6 custom-scrollbar overflow-y-auto max-h-96">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Detailed View</h2>
              <button
                onClick={() => setIsFlipped(false)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 rotate-180" />
              </button>
            </div>

            {/* Function Summary */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Function</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {data.function_summary}
              </p>
            </div>

            {/* All Domains */}
            {data.domains.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Domains ({data.domains.length})
                </h3>
                <div className="space-y-2">
                  {data.domains.map((domain, idx) => (
                    <div key={idx} className="bg-gray-50 rounded p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{domain.name}</span>
                        <span className="text-xs text-gray-500">{domain.source}</span>
                      </div>
                      {domain.description && (
                        <p className="text-xs text-gray-600 mt-1">{domain.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pathways */}
            {data.pathways.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Pathways ({data.pathways.length})
                </h3>
                <div className="space-y-1">
                  {data.pathways.map((pathway, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{pathway.name}</span>
                      {pathway.url && (
                        <a
                          href={pathway.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source Links */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Sources</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(data.source_links).map(([key, url]) => (
                  url && (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {key.toUpperCase()}
                    </a>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProteinCard;
