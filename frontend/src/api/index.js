import api from './client';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projectsAPI = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, memberId) => api.delete(`/projects/${id}/members/${memberId}`),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksAPI = {
  list: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  get: (projectId, taskId) => api.get(`/projects/${projectId}/tasks/${taskId}`),
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  update: (projectId, taskId, data) => api.put(`/projects/${projectId}/tasks/${taskId}`, data),
  delete: (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
  myTasks: () => api.get('/dashboard/my-tasks'),
  overdueTasks: () => api.get('/dashboard/overdue-tasks'),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersAPI = {
  search: (q) => api.get('/users/search', { params: { q } }),
};
