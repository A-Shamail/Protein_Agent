import axios from 'axios';
import { ProteinSearchRequest, ProteinSearchResponse } from '../types/protein';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 second timeout for protein searches
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔍 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const proteinAPI = {
  searchProtein: async (request: ProteinSearchRequest): Promise<ProteinSearchResponse> => {
    const response = await api.post<ProteinSearchResponse>('/api/protein/search', request);
    return response.data;
  },

  getProteinById: async (uniprotId: string) => {
    const response = await api.get(`/api/protein/${uniprotId}`);
    return response.data;
  },

  getProteinImage: async (uniprotId: string) => {
    const response = await api.get(`/api/protein/${uniprotId}/image`);
    return response.data;
  },

  getHealthCheck: async () => {
    const response = await api.get('/api/health');
    return response.data;
  },

  getSources: async () => {
    const response = await api.get('/api/sources');
    return response.data;
  },
};

export default api;
