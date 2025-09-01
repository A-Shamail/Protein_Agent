import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proteinAPI } from '../utils/api';
import { ProteinSearchRequest } from '../types/protein';

export const useProteinSearch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: ProteinSearchRequest) => proteinAPI.searchProtein(request),
    onSuccess: (data) => {
      // Cache the result using the UniProt accession as key
      if (data.success && data.data) {
        queryClient.setQueryData(
          ['protein', data.data.uniprot.accession],
          data.data
        );
      }
    },
  });
};

export const useProteinById = (uniprotId: string) => {
  return useQuery({
    queryKey: ['protein', uniprotId],
    queryFn: () => proteinAPI.getProteinById(uniprotId),
    enabled: !!uniprotId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useProteinImage = (uniprotId: string) => {
  return useQuery({
    queryKey: ['protein-image', uniprotId],
    queryFn: () => proteinAPI.getProteinImage(uniprotId),
    enabled: !!uniprotId,
    staleTime: 30 * 60 * 1000, // 30 minutes (images don't change often)
  });
};

export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => proteinAPI.getHealthCheck(),
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
    retry: 3,
  });
};

export const useSources = () => {
  return useQuery({
    queryKey: ['sources'],
    queryFn: () => proteinAPI.getSources(),
    staleTime: 60 * 60 * 1000, // 1 hour (sources info is static)
  });
};
