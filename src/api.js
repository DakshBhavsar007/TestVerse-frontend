import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL, timeout: 30000 });

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('testverse_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const startBasicTest = (url) =>
  api.post('/run', { url });

export const startLoginTest = (payload) =>
  api.post('/run', payload);

export const getTestResult = (testId) =>
  api.get(`/test/${testId}`);

export const listTests = (limit = 20, skip = 0) =>
  api.get('/history', { params: { limit, skip } });

export const deleteTest = (testId) =>
  api.delete(`/history/${testId}`);

export const checkHealth = () =>
  api.get('/health');

export default api;