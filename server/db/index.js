const path = require('path');
const fs = require('fs');

let dbClient = null;
let isPostgres = false;

function initDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      dbClient = {
        async query(text, params = []) {
          // Convert ? placeholders to $1, $2 for Postgres if needed
          let pIndex = 1;
          const pgText = text.replace(/\?/g, () => `$${pIndex++}`);
          const res = await pool.query(pgText, params);
          return { rows: res.rows, rowCount: res.rowCount };
        },
        async close() {
          await pool.end();
        }
      };
      isPostgres = true;
      console.log('📦 Connected to PostgreSQL database');
      return;
    } catch (err) {
      console.warn('⚠️ PostgreSQL connection failed, falling back to SQLite:', err.message);
    }
  }

  // SQLite fallback using better-sqlite3
  const Database = require('better-sqlite3');
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, 'samasyasetu.db');
  const sqlite = new Database(dbPath);

  // Enable foreign keys and WAL mode
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  dbClient = {
    async query(text, params = []) {
      const trimmed = text.trim();
      const isSelect = trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('WITH');
      
      try {
        const stmt = sqlite.prepare(text);
        if (isSelect) {
          const rows = stmt.all(...params);
          return { rows, rowCount: rows.length };
        } else {
          const info = stmt.run(...params);
          return { rows: [], rowCount: info.changes, lastInsertRowid: info.lastInsertRowid };
        }
      } catch (err) {
        console.error('SQL Execution Error:', err.message, '\nQuery:', text, '\nParams:', params);
        throw err;
      }
    },
    async close() {
      sqlite.close();
    }
  };
  isPostgres = false;
  console.log(`📦 Connected to SQLite database at ${dbPath}`);
}

initDb();

module.exports = {
  query: (text, params) => dbClient.query(text, params),
  isPostgres: () => isPostgres,
  close: () => dbClient.close()
};
