import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "dev-only-change-this-secret";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ success: false, message: "Token não informado." });
    return;
  }
  try {
    req.user = jwt.verify(token, secret) as Express.Request["user"];
    next();
  } catch {
    res.status(401).json({ success: false, message: "Sessão inválida ou expirada." });
  }
}

export function onlyGestor(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.perfil !== "gestor") {
    res.status(403).json({ success: false, message: "Acesso permitido somente ao gestor." });
    return;
  }
  next();
}
