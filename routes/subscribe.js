const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../db/sqlite1.db');

router.post('/', (req, res) => {
    const email = req.body.email?.trim();

    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Email 無效' });
    }

    const db = new sqlite3.Database(dbPath);
    db.run('INSERT INTO subscription (email) VALUES (?)', [email], function (err) {
        db.close();
        if (err) {
            console.error('[DB錯誤]', err.message); // ✅ 可印出具體錯誤
            if (err.message.includes('UNIQUE')) {
                return res.json({ success: false, error: '此 Email 已訂閱過' });
            }
            return res.status(500).json({ success: false, error: '資料庫錯誤' });
        }

        res.json({ success: true });
    });
});

module.exports = router;
