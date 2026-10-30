import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { db } from "./config/db";

dotenv.config();

async function main() {
  const nome = process.env.GESTOR_NOME || "Gestor";
  const email = process.env.GESTOR_EMAIL;
  const senha = process.env.GESTOR_SENHA;
  if (!email || !senha || senha.length < 8) {
    throw new Error("Defina GESTOR_EMAIL e GESTOR_SENHA (mínimo 8 caracteres) no .env.");
  }
  const hash = await bcrypt.hash(senha, 10);
  await db.execute(
    `INSERT INTO usuarios (nome,email,senha,perfil) VALUES (?,?,?,'gestor')
     ON DUPLICATE KEY UPDATE nome=VALUES(nome), senha=VALUES(senha), perfil='gestor'`,
    [nome, email.toLowerCase(), hash]
  );
  console.log(`Gestor configurado: ${email}`);
  await db.end();
}
main().catch(async (error) => { console.error(error); await db.end(); process.exit(1); });
