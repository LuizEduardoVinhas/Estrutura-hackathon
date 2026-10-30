import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import itemRoutes from "./routes/items";
import actionRoutes from "./routes/actions";
import { db } from "./config/db";

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ success: true, data: { status: "online", database: "connected" } });
  } catch {
    res.status(503).json({ success: false, message: "Banco de dados indisponível." });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/actions", actionRoutes);

app.use((_req, res) => res.status(404).json({ success: false, message: "Rota não encontrada." }));

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`API disponível em http://localhost:${port}`));
