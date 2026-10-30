import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../config/db";
import { authenticate } from "../middleware/auth";

const router = Router();
const secret = process.env.JWT_SECRET || "dev-only-change-this-secret";

type UserRow = RowDataPacket & {
  id: number; nome: string; email: string; senha: string; perfil: "cliente" | "gestor";
};

router.post("/register", async (req, res) => {
  try {
    const { nome, email, senha } = req.body as { nome?: string; email?: string; senha?: string };
    if (!nome?.trim() || !email?.trim() || !senha || senha.length < 6) {
      res.status(400).json({ success: false, message: "Informe nome, e-mail e senha com ao menos 6 caracteres." });
      return;
    }
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM usuarios WHERE email = ?", [email.toLowerCase().trim()]
    );
    if (existing.length) {
      res.status(409).json({ success: false, message: "Este e-mail já está cadastrado." });
      return;
    }
    const hash = await bcrypt.hash(senha, 10);
    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO usuarios (nome,email,senha,perfil) VALUES (?,?,?,'cliente')",
      [nome.trim(), email.toLowerCase().trim(), hash]
    );
    res.status(201).json({ success: true, data: { id: result.insertId }, message: "Conta criada. Faça seu login." });
  } catch {
    res.status(500).json({ success: false, message: "Não foi possível criar a conta." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body as { email?: string; senha?: string };
    if (!email || !senha) {
      res.status(400).json({ success: false, message: "Informe e-mail e senha." });
      return;
    }
    const [rows] = await db.execute<UserRow[]>(
      "SELECT id,nome,email,senha,perfil FROM usuarios WHERE email = ?", [email.toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(senha, user.senha))) {
      res.status(401).json({ success: false, message: "E-mail ou senha incorretos." });
      return;
    }
    const payload = { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil };
    const token = jwt.sign(payload, secret, { expiresIn: "8h" });
    res.json({ success: true, data: { token, user: payload } });
  } catch {
    res.status(500).json({ success: false, message: "Erro ao realizar login." });
  }
});

router.get("/me", authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

export default router;
