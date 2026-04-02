import axios from 'axios';

// In Docker: nginx proxies /api/ → api-gateway container (same origin, port 3000)
// In local dev (npm start): vite.config.js proxy handles /api/ → localhost:8080
const api = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'An error occurred';
    return Promise.reject(new Error(msg));
  }
);

// ── Customers ─────────────────────────────────────────────────
export const customerApi = {
  getAll:  ()         => api.get('/api/v1/customers'),
  getById: (id)       => api.get(`/api/v1/customers/${id}`),
  create:  (data)     => api.post('/api/v1/customers', data),
  update:  (id, data) => api.put(`/api/v1/customers/${id}`, data),
  delete:  (id)       => api.delete(`/api/v1/customers/${id}`),
};
// ── Accounts ──────────────────────────────────────────────────
export const accountApi = {
  getAll:       ()             => api.get('/api/v1/accounts'),
  getById:      (id)           => api.get(`/api/v1/accounts/${id}`),
  getByCustomer:(customerId)   => api.get(`/api/v1/accounts/customer/${customerId}`),
  create:       (data)         => api.post('/api/v1/accounts', data),
};

// ── Transactions ──────────────────────────────────────────────
export const transactionApi = {
  getByAccount: (accountId, page = 0, size = 20) =>
    api.get(`/api/v1/transactions/account/${accountId}?page=${page}&size=${size}`),
  getRecent: ()     => api.get('/api/v1/transactions/recent'),
  deposit:   (data) => api.post('/api/v1/transactions/deposit', data),
  withdraw:  (data) => api.post('/api/v1/transactions/withdraw', data),
  transfer:  (data) => api.post('/api/v1/transactions/transfer', data),
};

export default api;
