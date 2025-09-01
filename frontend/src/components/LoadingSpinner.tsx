import React from 'react';
import { motion } from 'framer-motion';
import { Dna, Database, Microscope, Network, MapPin, Zap } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  details?: string[];
}

const LOADING_STAGES = [
  { icon: Dna, label: 'Resolving protein ID', color: 'text-blue-500' },
  { icon: Database, label: 'Fetching UniProt data', color: 'text-green-500' },
  { icon: Microscope, label: 'Getting structures', color: 'text-purple-500' },
  { icon: Network, label: 'Finding interactions', color: 'text-orange-500' },
  { icon: MapPin, label: 'Loading pathways', color: 'text-red-500' },
  { icon: Zap, label: 'Generating summary', color: 'text-yellow-500' },
];

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Searching for protein data...",
  details = []
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12"
    >
      {/* Main Spinner */}
      <div className="relative mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full"
        />
        
        {/* DNA Icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Dna className="w-6 h-6 text-blue-500" />
        </div>
      </div>

      {/* Main Message */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-gray-900 mb-2"
      >
        {message}
      </motion.h3>

      {/* Loading Stages */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-4 mb-6"
      >
        {LOADING_STAGES.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <motion.div
              key={stage.label}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.3,
              }}
              className="flex flex-col items-center"
            >
              <div className={`p-2 rounded-full bg-gray-100 mb-1 ${stage.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs text-gray-600 text-center max-w-16">
                {stage.label}
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Details */}
      {details.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center max-w-md"
        >
          <p className="text-sm text-gray-600 mb-2">Currently processing:</p>
          <ul className="text-xs text-gray-500 space-y-1">
            {details.map((detail, index) => (
              <li key={index}>• {detail}</li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "100%" }}
        transition={{ delay: 0.8, duration: 1 }}
        className="w-64 h-1 bg-gray-200 rounded-full mt-6 overflow-hidden"
      >
        <motion.div
          animate={{ x: [-192, 192] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="h-full w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
        />
      </motion.div>

      {/* Estimated time */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-xs text-gray-500 mt-3"
      >
        This usually takes 10-30 seconds
      </motion.p>
    </motion.div>
  );
};

export default LoadingSpinner;
