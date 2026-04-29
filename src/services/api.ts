import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/store/authStore";

const fallbackBaseUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000";

function resolveApiBaseUrl() {
  const configuredUrl = (import.meta.env.VITE_API_BASE_URL as string) || fallbackBaseUrl;

  if (typeof window === "undefined") {
    return configuredUrl;
  }

  try {
    const url = new URL(configuredUrl);
    const frontendHost = window.location.hostname;
    const backendIsLocalOnly = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const frontendIsRemote =
      frontendHost !== "localhost" && frontendHost !== "127.0.0.1";

    if (backendIsLocalOnly && frontendIsRemote) {
      url.hostname = frontendHost;
      return url.toString().replace(/\/$/, "");
    }

    return configuredUrl;
  } catch {
    return configuredUrl;
  }
}

export const API_BASE_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // expired/invalid → auto logout
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
