const sqlite3 = require('sqlite3').verbose();
const path = require('path');
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
    // 檢查並建立 price_query 資料表
    db.run(`CREATE TABLE IF NOT EXISTS price_query (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_price REAL NOT NULL
    )`, (err) => {
      if (err) {
        console.error('建立 price_query 資料表失敗:', err.message);
      } else {
        console.log('已確認 price_query 資料表存在');

        // ✅ ✅ ✅ 👉 在這裡新增 notification_log 資料表 👇
        db.run(`CREATE TABLE IF NOT EXISTS notification_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            product_name TEXT NOT NULL,
            notify_date TEXT NOT NULL
        )`, (err) => {
          if (err) {
            console.error('建立 notification_log 資料表失敗:', err.message);
          } else {
            console.log('已確認 notification_log 資料表存在');
          }
        });

        // 先檢查資料表是否已有資料，若無才新增
        db.get('SELECT COUNT(*) as count FROM price_query', (err, row) => {
          if (err) {
            console.error('查詢資料表失敗:', err.message);
          } else if (row.count === 0) {
            // 僅在資料表為空時新增資料
            const insertSQL = `INSERT INTO price_query (date, product_name, product_price) VALUES 
              ("2024-04-26", "樂事洋芋片（原味）", 175),
              ("2023-06-22", "樂事洋芋片（原味）", 175),
              ("2021-01-15", "樂事洋芋片（原味）", 159)
            `;
            db.run(insertSQL, (err) => {
              if (err) {
                console.error('新增資料到 price_query 失敗:', err.message);
              } else {
                console.log('已新增初始資料到 price_query');
              }
            });
          } else {
            console.log('資料表已有資料，未重複新增');
          }
        });
      }
    });
  }
});

module.exports = db;

