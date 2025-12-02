const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 資料庫檔案路徑（Render 上也會用這個）
const dbPath = path.join(__dirname, 'data', 'maintenance.db');

const db = new sqlite3.Database(dbPath);

// 第一次啟動時建表（如果還沒建）
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT NOT NULL,
      line TEXT,
      section TEXT,
      date TEXT,
      category TEXT,
      downtime_min INTEGER,
      location_from TEXT,
      location_to TEXT,
      root_cause TEXT,
      action_taken TEXT
    )
  `);
});

module.exports = db;
