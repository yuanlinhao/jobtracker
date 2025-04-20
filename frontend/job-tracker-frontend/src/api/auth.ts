import { api } from "./client";

export const login = async (data: { email: string; password: string }) => {
    await api.post("/auth/login",data);
};

export const signup = async (data: { email:string; password: string }) => {
    await api.post("/auth/signup",data);
};

export const getCurrentUser = async () => {
    const response = await api.get("/auth/me");
    return response.data;
};

export const logout = async () => {
    await api.post("/auth/logout");
};