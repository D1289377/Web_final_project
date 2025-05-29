var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');

// 新增 sqlite3 相關程式碼
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// 確保 db 資料夾存在
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// 設定資料庫檔案路徑
const dbPath = path.join(__dirname, 'db', 'sqlite1.db');

// 開啟資料庫（若不存在則自動建立）
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('無法開啟資料庫:', err.message);
  } else {
    console.log('成功開啟資料庫:', dbPath);
  }
});

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var priceRouter = require('./routes/price');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname)); // 新增這行，讓根目錄下的 index.html 可被存取

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/price', priceRouter);

// 新增商品價格資料的 API
app.post('/api/insert', (req, res) => {
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'db', 'sqlite1.db');
  const db = new sqlite3.Database(dbPath);

  const { product_name, product_price, date } = req.body;
  if (!product_name || !product_price || !date) {
    db.close();
    return res.status(400).send('缺少必要欄位');
  }

  const sql = 'INSERT INTO price_query (date, product_name, product_price) VALUES (?, ?, ?)';
  db.run(sql, [date, product_name, product_price], function(err) {
    db.close();
    if (err) {
      return res.status(500).send('資料新增失敗');
    }
    res.send('資料新增成功');
  });
});

module.exports = app;
