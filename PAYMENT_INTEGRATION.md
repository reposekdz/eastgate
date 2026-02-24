# EastGate Hotel Payment System - Complete Integration Guide

## Overview
Production-ready payment system supporting multiple payment gateways with real API integrations.

## Supported Payment Methods
- **Stripe** - Credit/Debit Cards (Visa, Mastercard, Amex)
- **PayPal** - PayPal accounts and cards
- **Flutterwave** - Cards, Mobile Money (MTN, Airtel), Bank Transfer, USSD
- **MTN Mobile Money** - Direct MTN Rwanda integration
- **Airtel Money** - Direct Airtel Rwanda integration
- **Bank Transfer** - Manual bank transfer with instructions

## Environment Variables Required

```env
# Stripe
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=live

# Flutterwave
FLW_PUBLIC_KEY=FLWPUBK-...
FLW_SECRET_KEY=FLWSECK-...

# MTN Mobile Money
MTN_API_KEY=...
MTN_API_SECRET=...
MTN_SUBSCRIPTION_KEY=...

# Airtel Money
AIRTEL_CLIENT_ID=...
AIRTEL_CLIENT_SECRET=...

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@eastgate.rw
SMTP_PASSWORD=...

# SMS
SMS_API_KEY=...
SMS_SENDER_ID=EASTGATE

# App URLs
NEXT_PUBLIC_URL=https://eastgate.rw
NEXT_PUBLIC_API_URL=https://eastgate.rw/api
```

## API Endpoints

### 1. Process Payment (Unified)
**POST** `/api/payments/process`

```json
{
  "type": "booking|order|menu|event|spa",
  "method": "stripe|paypal|flutterwave|mtn|airtel|bank",
  "amount": 50000,
  "currency": "RWF",
  "customer": {
    "email": "guest@example.com",
    "name": "John Doe",
    "phone": "+250788000000"
  },
  "items": [
    {
      "id": "room_101",
      "name": "Deluxe Room",
      "quantity": 2,
      "price": 25000
    }
  ],
  "metadata": {
    "branchId": "kigali",
    "roomId": "101",
    "checkIn": "2024-01-15",
    "checkOut": "2024-01-17"
  }
}
```

### 2. Verify Payment
**GET** `/api/payments/verify?orderId=ORDER-123&provider=stripe&transactionId=pi_xxx`

### 3. Webhook Handler
**POST** `/api/payments/webhook?provider=stripe|paypal|flutterwave`

### 4. Service-Specific Endpoints

#### Booking Payment
**POST** `/api/bookings/payment`
```json
{
  "bookingId": "BK-123",
  "roomId": "101",
  "checkIn": "2024-01-15",
  "checkOut": "2024-01-17",
  "guests": 2,
  "amount": 50000,
  "method": "stripe",
  "customer": {...},
  "branchId": "kigali"
}
```

#### Restaurant Order Payment
**POST** `/api/orders/payment`
```json
{
  "orderId": "ORD-123",
  "items": [...],
  "amount": 15000,
  "method": "mtn",
  "customer": {...},
  "branchId": "kigali",
  "tableId": "T-05"
}
```

#### Menu/Delivery Payment
**POST** `/api/menu/payment`
```json
{
  "cart": [...],
  "amount": 20000,
  "method": "flutterwave",
  "customer": {...},
  "branchId": "kigali",
  "deliveryAddress": "KG 7 Ave, Kigali",
  "deliveryType": "delivery"
}
```

#### Event Booking Payment
**POST** `/api/events/payment`
```json
{
  "eventId": "EVT-123",
  "eventType": "wedding",
  "venue": "Grand Hall",
  "date": "2024-02-20",
  "duration": 8,
  "guests": 200,
  "services": [...],
  "amount": 500000,
  "method": "bank",
  "customer": {...},
  "branchId": "kigali"
}
```

#### Spa Appointment Payment
**POST** `/api/spa/payment`
```json
{
  "appointmentId": "SPA-123",
  "services": [...],
  "date": "2024-01-15",
  "time": "14:00",
  "therapist": "Sarah",
  "amount": 35000,
  "method": "paypal",
  "customer": {...},
  "branchId": "kigali"
}
```

## Payment Flow

### 1. Stripe (Card Payment)
```
Client → /api/payments/process → Stripe API → Payment Intent
Client → Stripe Elements → Confirm Payment → Webhook
Webhook → Update Order → Send Email/SMS → Fulfill Order
```

### 2. PayPal
```
Client → /api/payments/process → PayPal API → Order Created
Client → Redirect to PayPal → Approve Payment → Return URL
Client → /payment/success → Verify → Complete
```

### 3. Flutterwave
```
Client → /api/payments/process → Flutterwave API → Payment Link
Client → Redirect to Flutterwave → Complete Payment → Callback
Callback → /payment/callback → Verify → Success Page
```

### 4. Mobile Money (MTN/Airtel)
```
Client → /api/payments/process → Mobile Money API → USSD Push
User → Dial USSD → Enter PIN → Confirm
Webhook → Verify → Update Order → Notify
```

### 5. Bank Transfer
```
Client → /api/payments/process → Generate Reference
System → Send Bank Instructions via Email
User → Transfer Funds → Upload Proof
Admin → Verify → Confirm Payment
```

## Webhook Configuration

### Stripe Webhooks
URL: `https://eastgate.rw/api/payments/webhook?provider=stripe`
Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### PayPal Webhooks
URL: `https://eastgate.rw/api/payments/webhook?provider=paypal`
Events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

### Flutterwave Webhooks
URL: `https://eastgate.rw/api/payments/webhook?provider=flutterwave`
Events: `charge.completed`

## Security Features

1. **Environment Variables** - All API keys stored securely
2. **Webhook Signature Verification** - Validates all webhook requests
3. **Fraud Detection** - Built-in fraud scoring algorithm
4. **HTTPS Only** - All API calls over secure connections
5. **Transaction Logging** - Complete audit trail
6. **PCI Compliance** - Card data never touches server

## Email Notifications

- Payment confirmation with transaction details
- Detailed receipt with itemized breakdown
- Bank transfer instructions
- Payment failure notifications

## SMS Notifications

- Payment confirmation with order ID
- Mobile money payment prompts
- Order status updates

## Testing

### Test Cards (Stripe)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

### Test PayPal
Use PayPal Sandbox accounts

### Test Flutterwave
Use test API keys and test cards from Flutterwave docs

### Test Mobile Money
Use sandbox environments with test phone numbers

## Production Checklist

- [ ] Replace all test API keys with production keys
- [ ] Configure webhook endpoints in payment provider dashboards
- [ ] Set up SSL certificate (HTTPS)
- [ ] Configure SMTP for email notifications
- [ ] Set up SMS gateway
- [ ] Test all payment methods end-to-end
- [ ] Set up monitoring and alerts
- [ ] Configure database for transaction storage
- [ ] Set up backup and recovery
- [ ] Review security settings
- [ ] Test webhook signature verification
- [ ] Configure rate limiting
- [ ] Set up error logging

## Support

For issues or questions:
- Email: tech@eastgate.rw
- Phone: +250 788 000 000
