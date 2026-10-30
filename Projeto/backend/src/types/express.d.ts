import "express";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; nome: string; email: string; perfil: "cliente" | "gestor" };
    }
  }
}
export {};
