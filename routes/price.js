const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { sendNotificationEmail } = require('../mailer');


// 資料庫路徑
const dbPath = path.join(__dirname, '../db/sqlite1.db');

// GET /api/price 查詢所有商品價格資料並寄信
router.get('/', async (req, res) => {
  const db = new sqlite3.Database(dbPath);
  db.all('SELECT * FROM price_query ORDER BY date DESC', [], (err, rows) => {
    db.close();
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows); // ✅ 不要再寄信，這是查資料用的
  });
});



// GET /api/price/search?name=商品名稱&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/search', (req, res) => {
  const name = req.query.name;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const db = new sqlite3.Database(dbPath);
  let sql = 'SELECT * FROM price_query WHERE 1=1';
  const params = [];
  if (name && name.trim() !== '') {
    sql += ' AND product_name LIKE ?';
    params.push(`%${name}%`);
  }
  if (startDate && startDate.trim() !== '') {
    sql += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate && endDate.trim() !== '') {
    sql += ' AND date <= ?';
    params.push(endDate);
  }
  sql += ' ORDER BY date DESC';
  db.all(sql, params, (err, rows) => {
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

// 刪除單筆資料
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  console.log('刪除請求收到 id:', id); // 新增log
  const db = new sqlite3.Database(dbPath);
  db.run('DELETE FROM price_query WHERE id = ?', [id], function(err) {
    db.close();
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '找不到該筆資料' });
    }
    res.json({ success: true });
  });
});

module.exports = router;

