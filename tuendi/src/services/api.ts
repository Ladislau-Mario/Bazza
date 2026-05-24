import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const api = axios.create({
    baseURL,
});

// Injeta o token de autenticação em todos os pedidos
api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("baza_admin_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});
