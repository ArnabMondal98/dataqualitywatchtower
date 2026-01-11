import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('watchtower_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API functions
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getTimeline: (days = 7) => api.get(`/dashboard/timeline?days=${days}`)
};

export const dataSourcesApi = {
  getAll: () => api.get('/data-sources'),
  getById: (id) => api.get(`/data-sources/${id}`),
  getData: (id, limit = 50) => api.get(`/data-sources/${id}/data?limit=${limit}`),
  create: (data) => api.post('/data-sources', data),
  upload: (formData, name) => api.post(`/data-sources/upload?name=${encodeURIComponent(name)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const qualityChecksApi = {
  getAll: (sourceId = null) => api.get(`/quality-checks${sourceId ? `?data_source_id=${sourceId}` : ''}`),
  getSummary: () => api.get('/quality-checks/summary')
};

export const pipelineApi = {
  getRuns: () => api.get('/pipeline-runs'),
  getRunById: (id) => api.get(`/pipeline-runs/${id}`),
  rerun: (sourceId) => api.post(`/pipeline-runs/${sourceId}/rerun`)
};

export const alertsApi = {
  getConfigs: () => api.get('/alerts/config'),
  createConfig: (data) => api.post('/alerts/config', data),
  updateConfig: (id, data) => api.put(`/alerts/config/${id}`, data),
  deleteConfig: (id) => api.delete(`/alerts/config/${id}`),
  testAlert: (configId) => api.post(`/alerts/test?config_id=${configId}`)
};

export const lineageApi = {
  getLineage: (sourceId) => api.get(`/lineage/${sourceId}`)
};

export default api;
