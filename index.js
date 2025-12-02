import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
app.use(cors());
app.use(express.json());

// 開啟 SQLite（會自動建立 maintenance.db）
let db;
(async () => {
  db = await open({
    filename: './maintenance.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT,
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

  console.log("SQLite DB ready.");
})();
 
// POST /logs（寫入 SQLite）
app.post("/logs", async (req, res) => {
  try {
    const {
      asset_id, line, section, date,
      category, downtime_min,
      location_from, location_to,
      root_cause, action_taken
    } = req.body;

    await db.run(
      `INSERT INTO maintenance_logs
       (asset_id, line, section, date, category, downtime_min,
        location_from, location_to, root_cause, action_taken)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        asset_id, line, section, date, category, downtime_min,
        location_from, location_to, root_cause, action_taken
      ]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /logs（取全部資料）
app.get("/logs", async (req, res) => {
  const rows = await db.all(`SELECT * FROM maintenance_logs ORDER BY id DESC`);
  res.json(rows);
});

app.listen(3000, () => {
  console.log("Backend running at http://localhost:3000");
});
