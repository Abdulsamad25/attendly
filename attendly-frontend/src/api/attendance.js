import api from './axios';

export const clockInApi  = ()       => api.post('/attendance/clock-in');
export const clockOutApi = ()       => api.post('/attendance/clock-out');
export const getTodayApi = ()       => api.get('/attendance/today');
export const getMyAttendanceApi = (params) => api.get('/attendance/me', { params });

// Admin
export const getAllAttendanceApi   = (params) => api.get('/attendance/all', { params });
export const getTodaySummaryApi   = ()        => api.get('/attendance/today-summary');
export const overrideAttendanceApi = (id, data) => api.patch(`/attendance/${id}`, data);