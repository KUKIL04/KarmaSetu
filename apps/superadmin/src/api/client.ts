// apps/superadmin/src/api/client.ts
import axios from 'axios';

export const adminApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject the SuperAdmin JWT
adminApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('superadmin_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401/403 globally
adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/login');
    
    // Only kick the user if they are NOT actively trying to log in
    if (!isLoginRequest && (error.response?.status === 401 || error.response?.status === 403)) {
      localStorage.removeItem('superadmin_access_token');
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);