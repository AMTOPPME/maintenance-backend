// server.js
const express = require('express');
const cors = require('cors');   // ✅ 只要宣告一次
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000; // Render / Railway 會塞 PORT

// ✅ 開啟 CORS，讓瀏覽器 (file:// 或 https://) 都可以呼叫
app.use(cors());

// 解析 JSON body
app.use(express.json());

// 健康檢查
app.get('/', (req, res) => {
  res.json({ ok: true, msg: 'Maintenance backend running' });
});

// 建立 log
app.post('/logs', (req, res) => {
  const {
    asset_id, line, section, date,
    category, downtime_min,
    location_from, location_to,
    root_cause, action_taken
  } = req.body;

  const sql = `
    INSERT INTO maintenance_logs
    (asset_id, line, section, date, category, downtime_min,
     location_from, location_to, root_cause, action_taken)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      asset_id, line, section, date,
      category, downtime_min,
      location_from, location_to,
      root_cause, action_taken
    ],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ ok: false, error: 'DB insert failed' });
      }
      res.json({ ok: true, id: this.lastID });
    }
  );
});

// 取得全部 logs
app.get('/logs', (req, res) => {
  const sql = `SELECT * FROM maintenance_logs ORDER BY id DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ ok: false, error: 'DB query failed' });
    }
    res.json({ ok: true, data: rows });
  });
});

// 啟動
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
