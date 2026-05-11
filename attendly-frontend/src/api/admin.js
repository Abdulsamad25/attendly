import api from "./axios";

// Staff endpoints
export const staffApi = {
  getAll: async () => {
    const response = await api.get("/admin/staff");
    return response.data;
  },

  getPendingDebug: async () => {
    const response = await api.get("/admin/staff/pending-debug");
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/admin/staff", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.patch(`/admin/staff/${id}`, data);
    return response.data;
  },

  activate: async (id) => {
    const response = await api.patch(`/admin/staff/${id}/activate`);
    return response.data;
  },

  deactivate: async (id) => {
    const response = await api.patch(`/admin/staff/${id}/deactivate`);
    return response.data;
  },
};

// Attendance endpoints
export const attendanceApi = {
  getToday: async () => {
    const response = await api.get("/attendance/today");
    return response.data;
  },

  getTodaySummary: async () => {
    const response = await api.get("/attendance/today-summary");
    return response.data;
  },

  getRecent: async (limit = 10) => {
    const response = await api.get("/attendance/all", {
      params: { limit, page: 1 },
    });
    return response.data;
  },

  getAll: async (filters = {}) => {
    const response = await api.get("/attendance/all", { params: filters });
    return response.data;
  },

  getWeekly: async () => {
    const response = await api.get("/attendance/weekly");
    return response.data;
  },

  getMonthly: async () => {
    const response = await api.get("/attendance/monthly");
    return response.data;
  },
};

// Leave endpoints
export const leaveApi = {
  getPending: async () => {
    const response = await api.get("/leaves/all", {
      params: { status: "pending" },
    });
    return response.data;
  },

  getCalendar: async (params = {}) => {
    const response = await api.get("/leaves/calendar", { params });
    return response.data;
  },

  getAll: async (filters = {}) => {
    const response = await api.get("/leaves/all", { params: filters });
    return response.data;
  },

  approve: async (id, data = {}) => {
    const response = await api.patch(`/leaves/${id}/approve`, data);
    return response.data;
  },

  reject: async (id, data = {}) => {
    const response = await api.patch(`/leaves/${id}/reject`, data);
    return response.data;
  },
};

// Holiday endpoints
export const holidayApi = {
  getAll: async () => {
    const response = await api.get("/admin/holidays");
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/admin/holidays", data);
    return response.data;
  },

  syncHolidays: async (data) => {
    const response = await api.post("/admin/holidays/sync", data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/admin/holidays/${id}`);
    return response.data;
  },
};

// Settings endpoints
export const settingsApi = {
  get: async () => {
    const response = await api.get("/admin/settings");
    return response.data;
  },

  update: async (data) => {
    const response = await api.put("/admin/settings", data);
    return response.data;
  },
};

// Leave Types endpoints
export const leaveTypeApi = {
  getAll: async () => {
    const response = await api.get("/admin/leave-types");
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/admin/leave-types", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.patch(`/admin/leave-types/${id}`, data);
    return response.data;
  },
};

// Profile endpoints
export const profileApi = {
  get: async () => {
    const response = await api.get("/profile");
    return response.data;
  },

  update: async (data) => {
    const response = await api.put("/profile", data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.put("/profile/password", data);
    return response.data;
  },
};
