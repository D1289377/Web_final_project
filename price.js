const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 資料庫路徑
const dbPath = path.join(__dirname, '../db/sqlite1.db');

// GET /api/price 查詢所有商品價格資料
router.get('/', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  db.all('SELECT * FROM price_query ORDER BY date DESC', [], (err, rows) => {
    db.close();
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET /api/price/search?name=商品名稱 模糊查詢
router.get('/search', (req, res) => {
  const name = req.query.name || '';
  const db = new sqlite3.Database(dbPath);
  db.all('SELECT * FROM price_query WHERE product_name LIKE ? ORDER BY date DESC', [`%${name}%`], (err, rows) => {
    db.close();
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST /api/price/search 以 body 傳入 name 查詢
router.post('/search', (req, res) => {
  const name = req.body.name || '';
  const db = new sqlite3.Database(dbPath);
  db.all('SELECT * FROM price_query WHERE product_name LIKE ? ORDER BY date DESC', [`%${name}%`], (err, rows) => {
    db.close();
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

module.exports = router;

