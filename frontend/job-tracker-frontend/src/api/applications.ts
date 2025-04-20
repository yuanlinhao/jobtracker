import { api } from "./client";

export const getApplicationById = async (id: string) => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  };
  