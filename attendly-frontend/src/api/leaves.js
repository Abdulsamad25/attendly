import api from './axios';

// Deductions
export const getMyDeductionsApi        = (params) => api.get('/deductions/me', { params });
export const getMyCurrentDeductionApi  = ()        => api.get('/deductions/current');
export const getAllDeductionsApi        = (params) => api.get('/deductions/all', { params });
export const getMonthlySummaryApi      = (params) => api.get('/deductions/summary', { params });
export const exportPayrollExcelApi     = (params) => api.get('/deductions/export/excel', { params, responseType: 'blob' });
export const exportPayrollPDFApi       = (params) => api.get('/deductions/export/pdf',   { params, responseType: 'blob' });

// Leaves
export const createLeaveApi    = (data)      => api.post('/leaves', data);
export const getMyLeavesApi    = (params)    => api.get('/leaves/me', { params });
export const getLeaveTypesApi  = ()          => api.get('/leaves/types');
export const getLeaveBalanceApi = ()         => api.get('/leaves/balance');
export const cancelLeaveApi    = (id)        => api.delete(`/leaves/${id}`);
export const getAllLeavesApi    = (params)    => api.get('/leaves/all', { params });
export const approveLeaveApi   = (id, data)  => api.patch(`/leaves/${id}/approve`, data);
export const rejectLeaveApi    = (id, data)  => api.patch(`/leaves/${id}/reject`, data);
export const getLeaveCalendarApi = (params)  => api.get('/leaves/calendar', { params });