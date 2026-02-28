# 📱 Flutterwave Mobile Money Setup Guide

## Get Real Test Credentials (with PIN confirmation)

### Step 1: Create Flutterwave Account
1. Go to https://dashboard.flutterwave.com/signup
2. Sign up with your email
3. Verify your email address
4. Complete business profile

### Step 2: Get Test API Keys
1. Login to https://dashboard.flutterwave.com
2. Go to **Settings** → **API Keys**
3. Switch to **Test Mode** (toggle at top)
4. Copy your **Test Secret Key** (starts with `FLWSECK_TEST-`)
5. Copy your **Test Public Key** (starts with `FLWPUBK_TEST-`)

### Step 3: Update .env File
```env
FLW_SECRET_KEY="FLWSECK_TEST-your_actual_secret_key_here"
FLW_PUBLIC_KEY="FLWPUBK_TEST-your_actual_public_key_here"
```

### Step 4: Test Mobile Money Payments

**Rwanda Mobile Money Test Numbers:**

| Network | Test Phone Number | Test PIN | Amount |
|---------|------------------|----------|---------|
| MTN Rwanda | +250788000001 | 1234 | Any |
| Airtel Rwanda | +250788000002 | 1234 | Any |

**Test Flow:**
1. Go to booking page: http://localhost:3000/book
2. Select room and fill guest details
3. Choose **Flutterwave** payment method
4. Enter test phone number: `+250788000001`
5. Click "Pay Now"
6. You'll be redirected to Flutterwave payment page
7. Select **Mobile Money Rwanda**
8. Choose **MTN** or **Airtel**
9. Enter test phone number
10. **You'll receive PIN prompt** (in test mode, use PIN: `1234`)
11. Confirm payment
12. Redirected back to success page

**Important Notes:**
- ✅ Test mode = No real money charged
- ✅ PIN confirmation works in test mode
- ✅ Use test phone numbers provided by Flutterwave
- ✅ Test PIN is usually `1234` or `0000`
- ❌ Your personal phone won't receive PIN in test mode
- ❌ Must use Flutterwave's test numbers

### Step 5: Production Setup (Real Payments)

When ready for production:
1. Complete KYC verification on Flutterwave
2. Switch to **Live Mode** in dashboard
3. Get **Live API Keys**
4. Update .env with live keys:
```env
FLW_SECRET_KEY="FLWSECK-your_live_secret_key"
FLW_PUBLIC_KEY="FLWPUBK-your_live_public_key"
```
5. Now real phone numbers will receive PIN prompts

### Supported Payment Methods

**Flutterwave supports:**
- 📱 Mobile Money (MTN, Airtel, Tigo)
- 💳 Card Payments (Visa, Mastercard)
- 🏦 Bank Transfer
- 📞 USSD Payments
- 💰 Rwanda Franc (RWF)

### Test Card Numbers (Alternative)

If testing cards instead of Mobile Money:

```
Success Card: 5531886652142950
Expiry: 09/32
CVV: 564
PIN: 3310
OTP: 12345

Decline Card: 5143010522339965
```

### Troubleshooting

**Issue: No PIN prompt received**
- ✅ Solution: Use Flutterwave test phone numbers, not your real number

**Issue: Payment fails**
- ✅ Check API keys are correct
- ✅ Ensure test mode is enabled
- ✅ Use test phone numbers from Flutterwave docs

**Issue: Redirect fails**
- ✅ Check `NEXT_PUBLIC_URL` in .env is correct
- ✅ Ensure callback URL is whitelisted in Flutterwave dashboard

### Resources

- Flutterwave Dashboard: https://dashboard.flutterwave.com
- Test Credentials: https://developer.flutterwave.com/docs/integration-guides/testing-helpers
- Mobile Money Guide: https://developer.flutterwave.com/docs/collecting-payments/mobile-money
- API Documentation: https://developer.flutterwave.com/reference

### Support

For Flutterwave issues:
- Email: developers@flutterwavego.com
- Slack: https://join.slack.com/t/flutterwavedevelopers
- Twitter: @FlutterwaveEng
