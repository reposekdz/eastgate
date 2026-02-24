export interface ReceiptData {
  orderId: string;
  transactionId: string;
  date: Date;
  type: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  paymentMethod: string;
  branchId: string;
  metadata?: Record<string, any>;
}

export async function generateReceipt(data: ReceiptData): Promise<string> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: #f5f5f5; }
    .receipt { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { font-size: 14px; opacity: 0.9; }
    .status { background: #d1fae5; color: #065f46; padding: 15px; text-align: center; font-weight: bold; font-size: 18px; }
    .info { padding: 30px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .info-block h3 { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
    .info-block p { font-size: 16px; color: #111827; font-weight: 600; }
    .divider { height: 2px; background: #e5e7eb; margin: 30px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    thead { background: #f9fafb; }
    th { text-align: left; padding: 15px; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
    td { padding: 15px; border-bottom: 1px solid #e5e7eb; }
    .item-name { font-weight: 600; color: #111827; }
    .item-qty { color: #6b7280; }
    .totals { margin-top: 30px; }
    .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; }
    .total-row.subtotal { color: #6b7280; }
    .total-row.final { font-size: 24px; font-weight: bold; color: #10b981; border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 10px; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
    .footer strong { color: #111827; display: block; margin-bottom: 10px; }
    .qr-code { margin: 20px 0; }
    @media print {
      body { padding: 0; background: white; }
      .receipt { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>🏨 EASTGATE HOTEL RWANDA</h1>
      <p>Eastern Province, Rwanda | +250 788 000 000 | info@eastgate.rw</p>
    </div>
    
    <div class="status">
      ✓ PAYMENT SUCCESSFUL
    </div>
    
    <div class="info">
      <div class="info-grid">
        <div class="info-block">
          <h3>Receipt Number</h3>
          <p>${data.orderId}</p>
        </div>
        <div class="info-block">
          <h3>Transaction ID</h3>
          <p>${data.transactionId}</p>
        </div>
        <div class="info-block">
          <h3>Date & Time</h3>
          <p>${data.date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
        </div>
        <div class="info-block">
          <h3>Payment Method</h3>
          <p style="text-transform: uppercase;">${data.paymentMethod}</p>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="info-grid">
        <div class="info-block">
          <h3>Customer Name</h3>
          <p>${data.customer.name}</p>
        </div>
        <div class="info-block">
          <h3>Email</h3>
          <p>${data.customer.email}</p>
        </div>
        <div class="info-block">
          <h3>Phone</h3>
          <p>${data.customer.phone}</p>
        </div>
        <div class="info-block">
          <h3>Branch</h3>
          <p style="text-transform: capitalize;">${data.branchId}</p>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <h3 style="margin-bottom: 15px; color: #111827;">ITEMS</h3>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td class="item-name">${item.name}</td>
              <td class="item-qty" style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">${item.price.toLocaleString()} ${data.currency}</td>
              <td style="text-align: right; font-weight: 600;">${item.total.toLocaleString()} ${data.currency}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-row subtotal">
          <span>Subtotal</span>
          <span>${data.subtotal.toLocaleString()} ${data.currency}</span>
        </div>
        <div class="total-row subtotal">
          <span>Tax (18%)</span>
          <span>${data.tax.toLocaleString()} ${data.currency}</span>
        </div>
        ${data.discount > 0 ? `
        <div class="total-row subtotal">
          <span>Discount</span>
          <span style="color: #10b981;">-${data.discount.toLocaleString()} ${data.currency}</span>
        </div>
        ` : ''}
        <div class="total-row final">
          <span>TOTAL PAID</span>
          <span>${data.total.toLocaleString()} ${data.currency}</span>
        </div>
      </div>
      
      ${data.metadata?.checkIn ? `
      <div class="divider"></div>
      <div class="info-grid">
        <div class="info-block">
          <h3>Check-in</h3>
          <p>${data.metadata.checkIn}</p>
        </div>
        <div class="info-block">
          <h3>Check-out</h3>
          <p>${data.metadata.checkOut}</p>
        </div>
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <strong>Thank you for choosing EastGate Hotel Rwanda!</strong>
      <p>This is an official receipt for your transaction.</p>
      <p style="margin-top: 10px;">For inquiries: +250 788 000 000 | support@eastgate.rw</p>
      <p style="margin-top: 20px; font-size: 12px;">TIN: 123456789 | VAT Registered</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

export async function sendReceiptEmail(email: string, receiptHtml: string, orderId: string): Promise<void> {
  const nodemailer = require("nodemailer");
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"EastGate Hotel Rwanda" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Payment Receipt - ${orderId}`,
    html: receiptHtml,
    attachments: [{
      filename: `receipt-${orderId}.html`,
      content: receiptHtml,
    }],
  });
}
