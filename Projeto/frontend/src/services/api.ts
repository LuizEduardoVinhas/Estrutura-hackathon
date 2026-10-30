import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
  headers: { "Content-Type": "application/json" }
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fila_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export interface User { id: number; nome: string; email: string; perfil: "cliente" | "gestor" }
export interface Item { id: number; titulo: string; descricao: string; categoria: string; status: "Ativo" | "Indisponivel"; meta_dados?: unknown }
export type RequestStatus = "Pendente" | "Em Análise" | "Confirmado" | "Concluído" | "Cancelado";
export interface RequestItem {
  id: number; status: RequestStatus; criado_em: string; observacao?: string;
  item_titulo: string; categoria?: string; usuario_nome?: string; usuario_email?: string;
}
export interface ApiResponse<T> { success: boolean; data: T; message?: string }
