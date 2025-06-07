// mailer.js
const nodemailer = require('nodemailer');

// 建立 SMTP 傳送器（這裡以 Gmail 為例）
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'yinou610@gmail.com',              // 你的 Gmail
        pass: 'kltbbmzctcjhbnxo'                  // 應用程式密碼（非登入密碼）
    }
});

// ✅ 定義正確的函式名稱（你之前叫 sendPriceAlert，這裡要改）
function sendNotificationEmail(to, productName, price, date) {
    const mailOptions = {
        from: 'yinou610@gmail.com',
        to,
        subject: `📢 樂事 ${productName} 價格降到 ${price} 元`,
        text: `商品「${productName}」在 ${date} 的價格為 ${price} 元，低於通知門檻！`
    };

    return transporter.sendMail(mailOptions);
}

// ✅ 導出正確函式名稱
module.exports = { sendNotificationEmail };
