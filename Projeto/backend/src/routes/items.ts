import { Router } from "express";
import { RowDataPacket } from "mysql2";
import { db } from "../config/db";
import { authenticate, onlyGestor } from "../middleware/auth";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id,titulo,descricao,categoria,status,meta_dados,criado_em FROM itens ORDER BY id DESC"
    );
    res.json({ success: true, data: rows });
  } catch {
    res.status(500).json({ success: false, message: "Erro ao listar serviços." });
  }
});

router.post("/", authenticate, onlyGestor, async (req, res) => {
  try {
    const { titulo, descricao, categoria } = req.body as {
      titulo?: string; descricao?: string; categoria?: string;
    };
    if (!titulo?.trim() || !categoria?.trim()) {
      res.status(400).json({ success: false, message: "Título e categoria são obrigatórios." });
      return;
    }
    const [result] = await db.execute(
      "INSERT INTO itens (titulo,descricao,categoria) VALUES (?,?,?)",
      [titulo.trim(), descricao || "", categoria.trim()]
    );
    res.status(201).json({ success: true, data: result, message: "Serviço criado." });
  } catch {
    res.status(500).json({ success: false, message: "Erro ao criar serviço." });
  }
});

export default router;
