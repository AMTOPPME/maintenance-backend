// server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'maintenance.db');

// Middleware
app.use(cors());
app.use(express.json());

// 建立 / 開啟 DB
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite:', err);
  } else {
    console.log('SQLite connected:', DB_FILE);
  }
});

// 建立 logs 資料表（如果不存在）
db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      line TEXT,
      section TEXT,
      asset_id TEXT,
      category TEXT,
      downtime_min INTEGER,
      root_cause TEXT,
      action_taken TEXT,
      location_from TEXT,
      location_to TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    `,
    (err) => {
      if (err) {
        console.error('Failed to create table logs:', err);
      } else {
        console.log('Table logs ready.');
      }
    }
  );
});

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Maintenance backend is running.' });
});

// 取得所有 logs
app.get('/logs', (req, res) => {
  const sql = `SELECT * FROM logs ORDER BY date DESC, id DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching logs:', err);
      return res.status(500).json({ ok: false, error: 'DB error' });
    }
    res.json({ ok: true, data: rows });
  });
});

// 新增 log
app.post('/logs', (req, res) => {
  const {
    date,
    line,
    section,
    asset_id,
    category,
    downtime_min,
    root_cause,
    action_taken,
    location_from,
    location_to,
  } = req.body || {};

  const sql = `
    INSERT INTO logs
      (date, line, section, asset_id, category, downtime_min,
       root_cause, action_taken, location_from, location_to)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      date || null,
      line || null,
      section || null,
      asset_id || null,
      category || null,
      downtime_min || 0,
      root_cause || null,
      action_taken || null,
      location_from || null,
      location_to || null,
    ],
    function (err) {
      if (err) {
        console.error('Error inserting log:', err);
        return res.status(500).json({ ok: false, error: 'DB insert error' });
      }
      res.json({
        ok: true,
        id: this.lastID,
      });
    }
  );
});

//
// 🔹 更新 log：PUT /logs/:id
//
app.put('/logs/:id', (req, res) => {
  const id = req.params.id;

  // 允許被更新的欄位
  const allowedFields = [
    'date',
    'line',
    'section',
    'asset_id',
    'category',
    'downtime_min',
    'root_cause',
    'action_taken',
    'location_from',
    'location_to',
  ];

  const body = req.body || {};
  const sets = [];
  const values = [];

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      sets.push(`${field} = ?`);
      values.push(body[field]);
    }
  });

  if (sets.length === 0) {
    return res.status(400).json({
      ok: false,
      error: 'No valid fields to update',
    });
  }

  const sql = `UPDATE logs SET ${sets.join(', ')} WHERE id = ?`;
  values.push(id);

  db.run(sql, values, function (err) {
    if (err) {
      console.error('Error updating log:', err);
      return res.status(500).json({ ok: false, error: 'DB update error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ ok: false, error: 'Log not found' });
    }
    res.json({ ok: true, updated: this.changes });
  });
});

//
// 🔹 刪除 log：DELETE /logs/:id
//
app.delete('/logs/:id', (req, res) => {
  const id = req.params.id;

  const sql = `DELETE FROM logs WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) {
      console.error('Error deleting log:', err);
      return res.status(500).json({ ok: false, error: 'DB delete error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ ok: false, error: 'Log not found' });
    }
    res.json({ ok: true, deleted: this.changes });
  });
});

// 啟動 server
app.listen(PORT, () => {
  console.log(`Maintenance backend listening on port ${PORT}`);
});
