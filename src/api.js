import axios from 'axios';

const api = axios.create({
  // Live: set VITE_API_URL=https://your-backend.onrender.com/api on Vercel.
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;


