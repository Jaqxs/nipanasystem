import axios from "axios";

const API_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("gbms.auth.user");
      if (raw) {
        const user = JSON.parse(raw);
        if (user && user.token) {
          const authValue = `Bearer ${user.token}`;
          
          // 1. Set on config.headers (the most common way)
          config.headers = config.headers || {};
          config.headers['Authorization'] = authValue;
          
          // 2. Set using the .set() method if it exists (Axios 1.x)
          if (config.headers.set) {
            config.headers.set('Authorization', authValue);
          }

          // 3. Set on axios defaults just in case
          api.defaults.headers.common['Authorization'] = authValue;
          
          console.log(`[API Interceptor] Token attached for ${config.method?.toUpperCase()} ${config.url}`);
        } else {
          console.warn("[API Interceptor] Token not found in user object", user);
        }
      } else {
        console.warn("[API Interceptor] No auth user found in localStorage");
      }
    } catch (err) {
      console.error("[API Interceptor] Error parsing auth user", err);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add a response interceptor to handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Session expired or unauthorized. Redirecting to login...");
      // Optional: clear local storage and redirect if needed
      // window.location.href = "/login"; 
    }
    return Promise.reject(error);
  }
);

export default api;
