import axios from 'axios';

const DEFAULT_API_URL = 'http://localhost:5000/api';
const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const login = (email, password) => api.post('/admin/login', { email, password });
export const getProfile = () => api.get('/admin/profile');

// User Management APIs (SuperAdmin)
export const getAllUsers = () => api.get('/admin/all');
export const getAssignableUsers = () => api.get('/admin/assignable');
export const createUser = (data) => api.post('/admin/register', data);
export const updateUser = (id, data) => api.put(`/admin/${id}`, data);
export const deleteUser = (id) => api.delete(`/admin/${id}`);

// Event APIs
export const getEvents = () => api.get('/events');
export const getEvent = (id) => api.get(`/events/${id}`);
export const createEvent = (data) => api.post('/events', data);
export const updateEvent = (id, data) => api.put(`/events/${id}`, data);
export const deleteEvent = (id) => api.delete(`/events/${id}`);
export const assignUserToEvent = (eventId, userId) => api.post(`/events/${eventId}/assign`, { userId });
export const unassignUserFromEvent = (eventId, userId) => api.delete(`/events/${eventId}/assign/${userId}`);

// Participant APIs
export const getParticipants = (eventId) => api.get(`/participants/event/${eventId}`);
export const importParticipants = (eventId, participants) => api.post(`/participants/import/${eventId}`, { participants });
export const sendQRCodes = (eventId, participantIds) => api.post(`/participants/send-qr/${eventId}`, { participantIds });
export const markAttendance = (qrCode) => api.post('/participants/attendance', { qrCode });
export const searchParticipants = (eventId, query) => api.get(`/participants/search?eventId=${eventId}&query=${query}`);
export const previewCertificate = (eventId, payload) => api.post(`/participants/certificate-preview/${eventId}`, payload, { responseType: 'blob' });
export const sendCertificates = (eventId, payload = {}) => api.post(`/participants/send-certificates/${eventId}`, payload);
export const sendReceipts = (eventId, participantIds) => api.post(`/participants/send-receipts/${eventId}`, { participantIds });
export const sendNotifications = (eventId, data) => api.post(`/participants/notify/${eventId}`, data);
export const exportParticipants = (eventId, data) => api.post(`/participants/export/${eventId}`, data, {responseType: 'blob'});
export default api;
