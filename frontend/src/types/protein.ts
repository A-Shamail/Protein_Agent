export interface QueryInfo {
  name: string;
  species: string;
  taxid?: number;
}

export interface UniProtInfo {
  accession: string;
  reviewed: boolean;
  gene?: string;
  protein_name: string;
  organism: string;
  length: number;
  sequence?: string;
}

export interface GOTerm {
  id: string;
  name: string;
  category: string; // BP, MF, CC
  evidence?: string;
}

export interface GOAnnotations {
  biological_process: GOTerm[];
  molecular_function: GOTerm[];
  cellular_component: GOTerm[];
}

export interface Domain {
  source: string; // InterPro, Pfam
  id: string;
  name: string;
  description?: string;
  start?: number;
  end?: number;
}

export interface PDBEntry {
  id: string;
  method: string;
  resolution?: number;
  chains: string[];
  coverage?: string;
}

export interface AlphaFoldModel {
  model_url: string;
  pdb_url: string;
  image_url: string;
  confidence_avg?: number;
  confidence_ranges?: {
    very_high: number;
    confident: number;
    low: number;
    very_low: number;
  };
}

export interface StructureInfo {
  pdb_entries: PDBEntry[];
  alphafold?: AlphaFoldModel;
}

export interface Interaction {
  partner_id: string;
  partner_name: string;
  score: number;
  source: string;
}

export interface Pathway {
  database: string; // Reactome
  id: string;
  name: string;
  url?: string;
}

export interface SourceLinks {
  uniprot: string;
  rcsb?: string;
  alphafold?: string;
  string?: string;
  reactome?: string;
}

export interface ProvenanceInfo {
  source: string;
  retrieved: string;
  status: string;
}

export interface ProteinReport {
  query: QueryInfo;
  uniprot: UniProtInfo;
  function_summary: string;
  go_annotations: GOAnnotations;
  domains: Domain[];
  structures: StructureInfo;
  interactions: Interaction[];
  pathways: Pathway[];
  source_links: SourceLinks;
  provenance: ProvenanceInfo[];
  rarity: 'gold' | 'silver' | 'bronze';
  completeness_score: number;
}

export interface ProteinSearchRequest {
  query: string;
  species?: string;
  include_sequence?: boolean;
}

export interface ProteinSearchResponse {
  success: boolean;
  data?: ProteinReport;
  error?: string;
  processing_time: number;
}
