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
    api.post('/wallet/import', { private_key: privateKey, label }),
  create: (label?: string) =>
    api.post('/wallet/create', { label }),
  list: () => api.get('/wallet/list'),
};

export const vaultAPI = {
  deposit: (walletAddress: string, amount: string, symbol: string) =>
    api.post('/vault/deposit', {
      wallet_address: walletAddress,
      amount,
      symbol,
    }),
  transfer: (walletAddress: string, toAddress: string, amount: string, symbol: string) =>
    api.post('/vault/transfer', {
      wallet_address: walletAddress,
      to_address: toAddress,
      amount,
      symbol,
    }),
  withdraw: (walletAddress: string, amount: string, symbol: string) =>
    api.post('/vault/withdraw', {
      wallet_address: walletAddress,
      amount,
      symbol,
    }),
};

export const transferAPI = {
  transfer: (walletAddress: string, toAddress: string, amount: string, symbol: string = 'ETH') =>
    vaultAPI.transfer(walletAddress, toAddress, amount, symbol),
};

export const transactionAPI = {
  history: (limit?: number, offset?: number) =>
    api.get('/transactions/history', { params: { limit, offset } }),
};

export default api;
