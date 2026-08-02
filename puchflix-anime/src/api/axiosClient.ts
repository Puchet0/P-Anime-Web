import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  params: {
    apiKey: import.meta.env.VITE_API_KEY || 'dev-anime1v-key',
  },
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      console.warn('[API] Rate limited — retrying in 5s...');
    }
    return Promise.reject(error);
  }
);

export default apiClient;