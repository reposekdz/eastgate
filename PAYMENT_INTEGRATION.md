# 💳 Real Payment Integration Guide

## Overview

EastGate Hotel now supports **3 real payment gateways**:
- **Stripe** - Credit/Debit cards (Global)
- **PayPal** - PayPal accounts (Global)
- **Flutterwave** - Mobile Money, Cards, Bank Transfer (Africa)

---

## 🔧 Setup Instructions

### 1. Stripe Integration

**Get API Keys:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)
3. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)

**Add to `.env.local`:**
```env
STRIPE_SECRET_KEY=sk_test_51xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
```

**Features:**
- Real-time card processing
- 3D Secure authentication
- Automatic payment confirmation
- Receipt emails
- Refund support

---

### 2. PayPal Integration

**Get API Credentials:**
1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Create a new app
3. Copy **Client ID** and **Secret**

**Add to `.env.local`:**
```env
PAYPAL_CLIENT_ID=AYxxxxx
PAYPAL_CLIENT_SECRET=ELxxxxx
PAYPAL_MODE=sandbox  # Change to 'live' for production
```

**Features:**
- PayPal account payments
- Guest checkout (credit/debit cards)
- Buyer protection
- Multi-currency support
- Instant payment confirmation

---

### 3. Flutterwave Integration

**Get API Keys:**
1. Go to [Flutterwave Dashboard](https://dashboard.flutterwave.com/dashboard/settings/apis)
2. Copy **Secret Key** and **Public Key**

**Add to `.env.local`:**
```env
FLW_SECRET_KEY=FLWSECK_TEST-xxxxx
FLW_PUBLIC_KEY=FLWPUBK_TEST-xxxxx
```

**Features:**
- Mobile Money (MTN, Airtel, Tigo)
- Card payments (Visa, Mastercard)
- Bank transfers
- USSD payments
- Rwanda Franc (RWF) support

---

## 🚀 How It Works

### Booking Flow

1. **Guest selects room** → Fills booking details
2. **Chooses payment method** → Stripe/PayPal/Flutterwave
3. **Payment processing:**
   - **Stripe**: Embedded card form with 3D Secure
   - **PayPal**: Redirects to PayPal login/checkout
   - **Flutterwave**: Redirects to payment page with multiple options
4. **Payment confirmation** → Booking status updated to "confirmed"
5. **Success page** → Guest receives confirmation email

### API Endpoints

**Create Payment:**
```
POST /api/payments/public
Body: {
  bookingId, amount, currency, method, email, fullName, phone
}
Response: {
  success: true,
  gateway: "stripe|paypal|flutterwave",
  clientSecret: "...",  // Stripe
  approvalUrl: "...",   // PayPal
  paymentUrl: "..."     // Flutterwave
}
```

**Update Payment Status:**
```
PUT /api/payments/public
Body: { paymentId, status, transactionId }
```

**Payment Success Callback:**
```
GET /payment/success?bookingId=xxx&payment_intent=xxx
```

---

## 🔐 Security Features

- **PCI DSS Compliant** - No card data stored on server
- **SSL/TLS Encryption** - All payment data encrypted in transit
- **3D Secure** - Additional authentication for cards
- **Webhook Verification** - Secure payment status updates
- **Fraud Detection** - Built-in fraud prevention

---

## 💰 Currency Support

| Gateway      | Currencies                          |
|--------------|-------------------------------------|
| Stripe       | RWF, USD, EUR, GBP, 135+ currencies |
| PayPal       | USD, EUR, GBP, 25+ currencies       |
| Flutterwave  | RWF, USD, NGN, KES, 30+ currencies  |

**Note:** Amounts are automatically converted based on gateway requirements.

---

## 🧪 Testing

### Stripe Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
```

### PayPal Sandbox

Use PayPal sandbox accounts from your developer dashboard.

### Flutterwave Test

Use test mode credentials - payments won't be charged.

---

## 📊 Payment Status Flow

```
pending → processing → completed
                    ↓
                  failed
```

- **pending**: Payment initiated
- **processing**: Gateway processing payment
- **completed**: Payment successful, booking confirmed
- **failed**: Payment declined/error

---

## 🔄 Webhooks (Optional)

For production, set up webhooks to receive real-time payment updates:

**Stripe Webhook:**
```
URL: https://yourdomain.com/api/payments/webhook/stripe
Events: payment_intent.succeeded, payment_intent.payment_failed
```

**PayPal Webhook:**
```
URL: https://yourdomain.com/api/payments/webhook/paypal
Events: PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED
```

**Flutterwave Webhook:**
```
URL: https://yourdomain.com/api/payments/webhook/flutterwave
Events: charge.completed
```

---

## 🐛 Troubleshooting

**Stripe not loading:**
- Check `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Verify key starts with `pk_test_` or `pk_live_`

**PayPal redirect fails:**
- Ensure `NEXT_PUBLIC_URL` is correct
- Check `PAYPAL_MODE` matches your credentials

**Flutterwave payment page error:**
- Verify `FLW_SECRET_KEY` is correct
- Check amount is positive number

---

## 📝 Production Checklist

- [ ] Replace test API keys with live keys
- [ ] Set `PAYPAL_MODE=live`
- [ ] Configure webhook endpoints
- [ ] Test all payment methods
- [ ] Enable payment notifications
- [ ] Set up refund policies
- [ ] Configure receipt emails
- [ ] Test error handling
- [ ] Monitor payment logs

---

## 🎯 Features Implemented

✅ Real Stripe card processing with 3D Secure  
✅ PayPal checkout with guest payments  
✅ Flutterwave multi-channel payments  
✅ Automatic booking confirmation  
✅ Payment status tracking  
✅ Success/failure redirects  
✅ Receipt generation  
✅ Refund support (API ready)  
✅ Multi-currency support  
✅ Secure payment flow  

---

## 📞 Support

For payment gateway issues:
- **Stripe**: https://support.stripe.com
- **PayPal**: https://developer.paypal.com/support
- **Flutterwave**: https://support.flutterwave.com

For integration help: info@eastgate.rw
