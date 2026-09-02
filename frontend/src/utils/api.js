import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — redirect to login (except when already on login request)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────
export const login    = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getMe    = ()     => API.get('/auth/me');

// ── Campaigns ────────────────────────────────
export const getCampaigns      = ()         => API.get('/campaigns');
export const getCampaign       = (id)       => API.get(`/campaigns/${id}`);
export const createCampaign    = (data)     => API.post('/campaigns', data);
export const updateCampaign    = (id, data) => API.put(`/campaigns/${id}`, data);
export const deleteCampaign    = (id)       => API.delete(`/campaigns/${id}`);
export const getPublicCampaign = (slug)     => API.get(`/campaigns/public/${slug}`);

// ── CVs ──────────────────────────────────────
// submitCV receives a FormData object (handles both JSON fields + optional PDF file)
export const submitCV = (slug, formData) =>
  API.post(`/cvs/submit/${slug}`, formData);

export const getCV          = (id)           => API.get(`/cvs/${id}`);
export const updateCVStatus = (id, status)   => API.put(`/cvs/${id}/status`, { status });
export const addCVNote      = (id, text)     => API.post(`/cvs/${id}/notes`, { text });
export const updateCVRating = (id, rating)   => API.put(`/cvs/${id}/rating`, { rating });
export const searchCVs      = (query, campaignId) =>
  API.get('/cvs/search', { params: { query, campaignId } });

// Download the uploaded PDF — returns a blob so the caller can open it
export const getCVFile = (id) =>
  API.get(`/cvs/${id}/file`, { responseType: 'blob' });

// Download all uploaded CVs for a campaign as a ZIP file
export const downloadCampaignZip = (campaignId) =>
  API.get(`/campaigns/${campaignId}/download-zip`, { responseType: 'blob' });

// Re-extract PDF text and regenerate embeddings for all existing CVs
export const reindexPDFs = () => API.post('/cvs/reindex-pdfs');

// ── Analytics & HR Dashboard ─────────────────
export const getHRDashboardAnalytics = () => API.get('/analytics/hr-dashboard');

// ── Employee Management API ─────────────────
export const getEmployees     = (params) => API.get('/employees', { params });
export const getEmployee      = (id)     => API.get(`/employees/${id}`);
export const createEmployee   = (data)   => API.post('/employees', data);
export const updateEmployee   = (id, data) => API.put(`/employees/${id}`, data);
export const deleteEmployee   = (id)     => API.delete(`/employees/${id}`);

// ── Departments & Designations API ───────────
export const getDepartments       = ()         => API.get('/departments');
export const createDepartment     = (data)     => API.post('/departments/department', data);
export const updateDepartment     = (id, data) => API.put(`/departments/department/${id}`, data);
export const deleteDepartment     = (id)       => API.delete(`/departments/department/${id}`);

export const createDesignation    = (data)     => API.post('/departments/designation', data);
export const updateDesignation    = (id, data) => API.put(`/departments/designation/${id}`, data);
export const deleteDesignation    = (id)       => API.delete(`/departments/designation/${id}`);

// ── Attendance Management API ────────────────
export const getTodayAttendance   = ()         => API.get('/attendance/today');
export const checkInAttendance    = (data)     => API.post('/attendance/check-in', data);
export const checkOutAttendance   = ()         => API.post('/attendance/check-out');
export const getAttendanceLogs    = (params)   => API.get('/attendance', { params });
export const updateAttendanceLog  = (id, data) => API.put(`/attendance/${id}`, data);
export const getMonthlyReport     = (params)   => API.get('/attendance/monthly-report', { params });

// ── Leave Management API ─────────────────────
export const getLeaveBalance      = (employeeId) => API.get('/leaves/balance', { params: { employeeId } });
export const getLeaveRequests     = (params)   => API.get('/leaves', { params });
export const submitLeaveRequest   = (formData) => API.post('/leaves/request', formData);
export const reviewLeaveRequest   = (id, data) => API.put(`/leaves/${id}/review`, data);
export const updateLeaveEntitlement = (data)   => API.put('/leaves/entitlement', data);

// ── Onboarding API ───────────────────────────
export const getOnboardings        = (params)   => API.get('/onboarding', { params });
export const getOnboardingDetails = (empId)    => API.get(`/onboarding/${empId}`);
export const initiateOnboarding    = (data)     => API.post('/onboarding/initiate', data);
export const updateOnboardingTask  = (id, taskId, data) => API.put(`/onboarding/${id}/task/${taskId}`, data);
export const addCustomOnboardingTask = (id, data) => API.post(`/onboarding/${id}/custom-task`, data);

// ── Secure Employee Documents API ────────────
export const getEmployeeDocuments = (params)   => API.get('/documents', { params });
export const uploadEmployeeDocument = (formData) => API.post('/documents/upload', formData);
export const downloadEmployeeDocument = (id)   => API.get(`/documents/${id}/download`, { responseType: 'blob' });
export const deleteEmployeeDocument = (id)     => API.delete(`/documents/${id}`);

export default API;

