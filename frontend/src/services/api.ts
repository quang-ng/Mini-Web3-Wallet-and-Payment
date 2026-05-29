import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (email: string, name: string, password: string) =>
    api.post('/auth/register', { email, name, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

export const walletAPI = {
  import: (privateKey: string, label: string) =>
    api.post('/wallets/import', { private_key: privateKey, label }),
  list: () => api.get('/wallets/list'),
};

export const transferAPI = {
  transfer: (walletAddress: string, toAddress: string, amount: string, tokenAddress?: string) =>
    api.post('/transfer', {
      wallet_address: walletAddress,
      to_address: toAddress,
      amount,
      token_address: tokenAddress || null,
    }),
};

export const transactionAPI = {
  history: (limit?: number, offset?: number) =>
    api.get('/transactions', { params: { limit, offset } }),
};

export default api;
