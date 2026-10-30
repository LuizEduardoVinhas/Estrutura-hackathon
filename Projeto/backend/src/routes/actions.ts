import { Router } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../config/db";
import { authenticate, onlyGestor } from "../middleware/auth";

const router = Router();
const validStatuses = ["Pendente", "Em Análise", "Confirmado", "Concluído", "Cancelado"];

router.use(authenticate);

router.post("/", async (req, res) => {
  try {
    const { item_id, observacao } = req.body as { item_id?: number; observacao?: string };
    if (!item_id || !Number.isInteger(Number(item_id))) {
      res.status(400).json({ success: false, message: "Serviço inválido." });
      return;
    }
    const [items] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM itens WHERE id = ? AND status = 'Ativo'", [item_id]
    );
    if (!items.length) {
      res.status(404).json({ success: false, message: "Serviço indisponível." });
      return;
    }
    const [duplicates] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM solicitacoes WHERE usuario_id = ? AND item_id = ? AND status IN ('Pendente','Em Análise','Confirmado')",
      [req.user!.id, item_id]
    );
    if (duplicates.length) {
      res.status(409).json({ success: false, message: "Você já possui uma solicitação ativa para este serviço." });
      return;
    }
    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO solicitacoes (usuario_id,item_id,observacao) VALUES (?,?,?)",
      [req.user!.id, item_id, observacao || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId }, message: "Solicitação enviada." });
  } catch {
    res.status(500).json({ success: false, message: "Erro ao criar solicitação." });
  }
});

router.get("/user/:id", async (req, res) => {
  if (req.user!.perfil !== "gestor" && Number(req.params.id) !== req.user!.id) {
    res.status(403).json({ success: false, message: "Você não pode consultar solicitações de outro usuário." });
    return;
  }
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT s.id,s.usuario_id,s.item_id,s.status,s.observacao,s.criado_em,
              i.titulo AS item_titulo,i.categoria,u.nome AS usuario_nome,u.email AS usuario_email
       FROM solicitacoes s
       INNER JOIN itens i ON i.id = s.item_id
       INNER JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.usuario_id = ? ORDER BY s.criado_em DESC`, [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch {
    res.status(500).json({ success: false, message: "Erro ao consultar solicitações." });
  }
});

router.get("/", onlyGestor, async (_req, res) => {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT s.id,s.status,s.observacao,s.criado_em,i.titulo AS item_titulo,
              i.categoria,u.nome AS usuario_nome,u.email AS usuario_email
       FROM solicitacoes s JOIN itens i ON i.id=s.item_id
       JOIN usuarios u ON u.id=s.usuario_id ORDER BY s.criado_em DESC`
    );
    res.json({ success: true, data: rows });
  } catch {
    res.status(500).json({ success: false, message: "Erro ao listar solicitações." });
  }
});

router.patch("/:id/status", onlyGestor, async (req, res) => {
  try {
    const { status } = req.body as { status?: string };
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: "Status inválido." });
      return;
    }
    const [result] = await db.execute<ResultSetHeader>(
      "UPDATE solicitacoes SET status = ? WHERE id = ?", [status, req.params.id]
    );
    if (!result.affectedRows) {
      res.status(404).json({ success: false, message: "Solicitação não encontrada." });
      return;
    }
    res.json({ success: true, data: { id: Number(req.params.id), status }, message: "Status atualizado." });
  } catch {
    res.status(500).json({ success: false, message: "Erro ao atualizar status." });
  }
});

export default router;
