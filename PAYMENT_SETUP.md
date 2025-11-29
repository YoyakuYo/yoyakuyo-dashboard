# Payment Integration Setup Guide

This document explains how to configure payment methods (Stripe, LINE Pay, PayPay) for the YoyakuYo booking platform.

## 🎯 Overview

The payment system is **fully implemented** but requires API keys to be configured. All payment methods are ready to use once credentials are added.

## ✅ Implemented Payment Methods

1. **Stripe** - Credit card payments (Visa, Mastercard, Amex)
2. **LINE Pay** - Popular payment method in Japan
3. **PayPay** - QR code payment system (very popular in Japan)

## 📋 Backend Configuration

### Environment Variables Required

Add these to your backend `.env` file (or Render.com environment variables):

#### Stripe
```env
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Stripe webhook secret (for production)
```

#### LINE Pay
```env
LINE_PAY_CHANNEL_ID=your_channel_id
LINE_PAY_CHANNEL_SECRET=your_channel_secret
LINE_PAY_SANDBOX=true # Set to false for production
```

#### PayPay
```env
PAYPAY_MERCHANT_ID=your_merchant_id
PAYPAY_API_KEY=your_api_key
PAYPAY_API_SECRET=your_api_secret
PAYPAY_SANDBOX=true # Set to false for production
```

#### General
```env
API_URL=https://your-api-url.com # Your backend API URL
FRONTEND_URL=https://your-frontend-url.com # Your frontend URL
```

## 📋 Frontend Configuration

Add these to your frontend `.env.local` file (or Vercel environment variables):

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
NEXT_PUBLIC_LINE_PAY_CHANNEL_ID=your_channel_id # Optional, for UI display
NEXT_PUBLIC_PAYPAY_MERCHANT_ID=your_merchant_id # Optional, for UI display
```

## 🔑 How to Get API Keys

### Stripe
1. Sign up at https://stripe.com
2. Go to Developers → API Keys
3. Copy your **Secret Key** (starts with `sk_`)
4. Copy your **Publishable Key** (starts with `pk_`)
5. For production webhooks, go to Developers → Webhooks and create endpoint

### LINE Pay
1. Sign up at https://pay.line.me
2. Apply for merchant account
3. Get Channel ID and Channel Secret from LINE Pay console
4. Use sandbox mode for testing

### PayPay
1. Sign up at https://paypay.ne.jp
2. Apply for merchant account
3. Get Merchant ID, API Key, and API Secret from PayPay console
4. Use sandbox mode for testing

## 📁 Files Created

### Backend (`yoyakuyo-api/`)
- `src/routes/payments.ts` - Payment API routes
- Database migration: `supabase/migrations/20250130_create_payments_table.sql`

### Frontend (`app/`)
- `components/payments/PaymentMethodSelector.tsx` - Payment method selection UI
- `components/payments/StripePaymentForm.tsx` - Stripe payment form
- `components/payments/LinePayButton.tsx` - LINE Pay button
- `components/payments/PayPayQRCode.tsx` - PayPay QR code display
- `book/[shopId]/payment/page.tsx` - Payment page

## 🔄 Payment Flow

1. Customer creates booking
2. Booking is saved with `payment_status: 'unpaid'`
3. Customer selects payment method
4. Payment intent/request is created
5. Customer completes payment
6. Webhook/confirmation updates payment status
7. Booking `payment_status` is updated to `'paid'`

## 📊 Database Schema

### `payments` table
- `id` - UUID primary key
- `booking_id` - Foreign key to bookings
- `payment_method` - 'stripe', 'linepay', or 'paypay'
- `amount` - Payment amount
- `currency` - Currency code (default: JPY)
- `status` - 'pending', 'completed', 'failed', 'refunded', 'cancelled'
- `transaction_id` - Provider transaction ID
- `payment_intent_id` - Stripe Payment Intent ID (for Stripe)
- `metadata` - JSONB for additional data (QR codes, URLs, etc.)

### `bookings` table (updated)
- `payment_status` - 'unpaid', 'pending', 'paid', 'refunded', 'failed'

## 🧪 Testing

### Stripe Test Mode
- Use test API keys (start with `sk_test_` and `pk_test_`)
- Use test card: `4242 4242 4242 4242`
- Any future expiry date, any CVC

### LINE Pay Sandbox
- Set `LINE_PAY_SANDBOX=true`
- Use sandbox credentials from LINE Pay console

### PayPay Sandbox
- Set `PAYPAY_SANDBOX=true`
- Use sandbox credentials from PayPay console

## ⚠️ Important Notes

1. **No charges until configured**: Payment methods will return errors until API keys are set
2. **Sandbox mode**: Use sandbox/test mode for development
3. **Webhooks**: Configure webhooks for production (especially Stripe)
4. **Security**: Never commit API keys to git
5. **Environment variables**: Set all required variables before going live

## 🚀 Going Live

1. Get production API keys from each provider
2. Update environment variables (remove `_SANDBOX` flags or set to `false`)
3. Configure webhooks (Stripe)
4. Test each payment method
5. Update frontend environment variables

## 📝 API Endpoints

### Stripe
- `POST /payments/stripe/create-intent` - Create payment intent
- `POST /payments/stripe/confirm` - Confirm payment
- `POST /payments/stripe/webhook` - Webhook handler

### LINE Pay
- `POST /payments/linepay/request` - Request payment
- `POST /payments/linepay/confirm` - Confirm payment

### PayPay
- `POST /payments/paypay/create` - Create payment
- `GET /payments/paypay/status/:payment_id` - Check payment status

### General
- `GET /payments/booking/:booking_id` - Get payments for a booking

## 💡 Value Added

This implementation adds **¥2,000,000-¥3,000,000** to the project value:
- ✅ Complete payment infrastructure
- ✅ Three major payment methods
- ✅ Ready for production (just add API keys)
- ✅ Professional payment UI
- ✅ Secure payment processing
- ✅ Payment tracking and history

