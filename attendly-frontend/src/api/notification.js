import api from "./axios";

export const notificationApi = {
  get: () => api.get("/notifications"),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  sendMessage: (receiverId, message) =>
    api.post("/notifications/send", { receiverId, message }),
};
