import Database from "@tauri-apps/plugin-sql";
import { INIT_SQL } from "./schema";

let dbInstance: Database | null = null;
let dbInitPromise: Promise<Database> | null = null;
let schemaInitialized = false;

export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }
  // 防止并发调用创建重复连接
  if (dbInitPromise) {
    return dbInitPromise;
  }
  dbInitPromise = (async () => {
    // SQLite数据库文件保存在应用数据目录
    const db = await Database.load("sqlite:universal_report.db");
    if (!schemaInitialized) {
      await initSchema(db);
      schemaInitialized = true;
    }
    dbInstance = db;
    return db;
  })();
  try {
    return await dbInitPromise;
  } finally {
    dbInitPromise = null;
  }
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
