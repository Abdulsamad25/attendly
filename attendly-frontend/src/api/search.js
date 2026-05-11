import api from "./axios";

export const searchApi = {
  global: (q) => api.get(`/search?q=${encodeURIComponent(q)}`),
};
