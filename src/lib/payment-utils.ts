import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendPaymentConfirmation(data: {
  email: string;
  orderId: string;
  amount: number;
  currency: string;
  transactionId: string;
  type: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .amount { font-size: 32px; font-weight: bold; color: #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Confirmed</h1>
        </div>
        <div class="content">
          <p>Dear Valued Guest,</p>
          <p>Your payment has been successfully processed.</p>
          <div class="details">
            <p><strong>Order ID:</strong> ${data.orderId}</p>
            <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
            <p><strong>Type:</strong> ${data.type.toUpperCase()}</p>
            <p><strong>Amount:</strong> <span class="amount">${data.amount.toLocaleString()} ${data.currency}</span></p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>Thank you for choosing EastGate Hotel Rwanda.</p>
        </div>
        <div class="footer">
          <p>EastGate Hotel Rwanda | Eastern Province, Rwanda</p>
          <p>+250 788 000 000 | info@eastgate.rw</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"EastGate Hotel" <${process.env.SMTP_USER}>`,
    to: data.email,
    subject: `Payment Confirmation - ${data.orderId}`,
    html,
  });
}

export async function sendPaymentReceipt(data: {
  email: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  transactionId: string;
}) {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.price.toLocaleString()} ${data.currency}</td>
      <td>${(item.quantity * item.price).toLocaleString()} ${data.currency}</td>
    </tr>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f3f4f6; font-weight: bold; }
        .total { font-size: 20px; font-weight: bold; color: #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>EastGate Hotel Rwanda</h1>
          <h2>Payment Receipt</h2>
          <p>Order: ${data.orderId}</p>
          <p>Transaction: ${data.transactionId}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3"><strong>Subtotal</strong></td>
              <td>${data.subtotal.toLocaleString()} ${data.currency}</td>
            </tr>
            <tr>
              <td colspan="3"><strong>Tax (18%)</strong></td>
              <td>${data.tax.toLocaleString()} ${data.currency}</td>
            </tr>
            <tr>
              <td colspan="3" class="total">TOTAL</td>
              <td class="total">${data.total.toLocaleString()} ${data.currency}</td>
            </tr>
          </tfoot>
        </table>
        <p style="text-align: center; margin-top: 30px;">Thank you for your business!</p>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"EastGate Hotel" <${process.env.SMTP_USER}>`,
    to: data.email,
    subject: `Receipt - ${data.orderId}`,
    html,
  });
}

export async function sendSMS(phone: string, message: string) {
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || "EASTGATE";

  await fetch("https://api.sms.rw/v1/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: senderId,
      recipients: [phone],
      message,
    }),
  });
}
