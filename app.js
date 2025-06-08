var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const { sendNotificationEmail } = require('./mailer'); // 請確認這行有加在最上面


// 引入 db.js 進行資料庫初始化
var db = require('./db');

// 設定資料庫檔案路徑
const dbPath = path.join(__dirname, 'db', 'sqlite1.db');
const subscribeRoute = require('./routes/subscribe');

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
app.use(express.static(__dirname)); // 新增這行，讓根目錄下的 main.html 可被存取

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/price', priceRouter);
app.use('/api/subscribe', subscribeRoute);


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
    if (err) {
      db.close();
      return res.status(500).send('資料新增失敗');
    }

    // ✅ 僅插入成功後才判斷是否寄信
    if (Number(product_price) <= 180) {
      const db2 = new sqlite3.Database(dbPath);

      db2.all('SELECT email FROM subscription WHERE notify_enabled = 1', [], async (err2, emails) => {
        if (err2) {
          console.error('查詢訂閱者失敗：', err2.message);
          db2.close();
          return;
        }

        const notifyTasks = emails.map(user => {
          return new Promise((resolve) => {
            const checkSQL = `
              SELECT COUNT(*) AS count
              FROM notification_log
              WHERE email = ? AND product_name = ? AND notify_date = ?
            `;
            db2.get(checkSQL, [user.email, product_name, date], async (err3, row) => {
              if (err3) {
                console.error('查詢通知紀錄失敗:', err3.message);
                return resolve(); // 避免中斷其他通知
              }

              if (row.count === 0) {
                try {
                  await sendNotificationEmail(user.email, product_name, product_price, date);
                  console.log(`[已通知] ${user.email} - ${product_name} (${product_price})`);

                  db2.run(
                      'INSERT INTO notification_log (email, product_name, notify_date) VALUES (?, ?, ?)',
                      [user.email, product_name, date],
                      (err4) => {
                        if (err4) {
                          console.error('寫入通知紀錄失敗:', err4.message);
                        }
                        resolve();
                      }
                  );
                } catch (e) {
                  console.error('寄送失敗:', e.message);
                  resolve();
                }
              } else {
                console.log(`[略過通知] ${user.email} 已通知過 ${product_name} (${date})`);
                resolve();
              }
            });
          });
        });

        await Promise.all(notifyTasks); // ✅ 等所有通知處理完才關閉 DB
        db2.close();
      });
    }



    res.send('資料新增成功'); // ✅ 注意：db.close() 已上面關過一次就好
  });
});


// 新增 CSV 匯入 API
app.post('/api/import', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  const { data } = req.body;

  if (!data || !Array.isArray(data) || data.length === 0) {
    db.close();
    return res.status(400).json({ error: '無效的資料格式' });
  }

  let successCount = 0;
  const stmt = db.prepare('INSERT INTO price_query (date, product_name, product_price) VALUES (?, ?, ?)');

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    data.forEach(item => {
      if (item.date && item.product_name && item.product_price) {
        stmt.run([item.date, item.product_name, item.product_price], function(err) {
          if (!err) successCount++;
        });
      }
    });

    db.run('COMMIT', function(err) {
      stmt.finalize();
      db.close();

      if (err) {
        return res.status(500).json({ error: '匯入失敗' });
      }

      res.json({ success: true, count: successCount });
    });
  });
});

module.exports = app;
