import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  console.warn('[API] VITE_API_KEY no configurada — verifica .env');
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  params: {
    apiKey: API_KEY,
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