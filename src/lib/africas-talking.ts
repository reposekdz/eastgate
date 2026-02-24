const AT_API_KEY = process.env.AFRICAS_TALKING_API_KEY!;
const AT_USERNAME = process.env.AFRICAS_TALKING_USERNAME!;
const AT_SENDER_ID = process.env.AFRICAS_TALKING_SENDER_ID || "EASTGATE";

export async function sendAfricasTalkingSMS(phone: string, message: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        "apiKey": AT_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        username: AT_USERNAME,
        to: phone,
        message: message,
        from: AT_SENDER_ID,
      }),
    });

    const result = await response.json();
    
    if (result.SMSMessageData?.Recipients?.[0]?.status === "Success") {
      console.log("SMS sent successfully:", result);
      return true;
    } else {
      console.error("SMS failed:", result);
      return false;
    }
  } catch (error) {
    console.error("Africa's Talking SMS error:", error);
    return false;
  }
}

export async function sendBulkSMS(recipients: Array<{ phone: string; message: string }>): Promise<void> {
  const promises = recipients.map(r => sendAfricasTalkingSMS(r.phone, r.message));
  await Promise.all(promises);
}

export async function sendPaymentNotification(data: {
  phone: string;
  orderId: string;
  amount: number;
  currency: string;
  status: "success" | "pending" | "failed";
}): Promise<void> {
  const messages = {
    success: `✅ Payment Confirmed!\nOrder: ${data.orderId}\nAmount: ${data.amount.toLocaleString()} ${data.currency}\nThank you for choosing EastGate Hotel Rwanda.\nCall: +250788000000`,
    pending: `⏳ Payment Processing\nOrder: ${data.orderId}\nAmount: ${data.amount.toLocaleString()} ${data.currency}\nWe'll notify you once confirmed.\nEastGate Hotel Rwanda`,
    failed: `❌ Payment Failed\nOrder: ${data.orderId}\nPlease try again or contact support.\nEastGate Hotel: +250788000000`,
  };

  await sendAfricasTalkingSMS(data.phone, messages[data.status]);
}

export async function sendBookingConfirmation(data: {
  phone: string;
  bookingId: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  amount: number;
}): Promise<void> {
  const message = `🏨 Booking Confirmed!\nID: ${data.bookingId}\nRoom: ${data.roomNumber}\nCheck-in: ${data.checkIn}\nCheck-out: ${data.checkOut}\nTotal: ${data.amount.toLocaleString()} RWF\nEastGate Hotel Rwanda`;
  
  await sendAfricasTalkingSMS(data.phone, message);
}

export async function sendOrderConfirmation(data: {
  phone: string;
  orderId: string;
  items: number;
  total: number;
  estimatedTime: string;
}): Promise<void> {
  const message = `🍽️ Order Confirmed!\nOrder: ${data.orderId}\nItems: ${data.items}\nTotal: ${data.total.toLocaleString()} RWF\nETA: ${data.estimatedTime}\nEastGate Hotel Restaurant`;
  
  await sendAfricasTalkingSMS(data.phone, message);
}
