import Database from "@tauri-apps/plugin-sql";
import { INIT_SQL } from "./schema";

let dbInstance: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }
  // SQLite数据库文件保存在应用数据目录
  dbInstance = await Database.load("sqlite:universal_report.db");
  await initSchema(dbInstance);
  return dbInstance;
}

async function initSchema(db: Database): Promise<void> {
  const statements = INIT_SQL.split(";").filter((s) => s.trim().length > 0);
  for (const stmt of statements) {
    await db.execute(stmt);
  }
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}
