# Stripe Subscription Setup for Shop Owners

This guide will help you set up Stripe subscriptions so shop owners can pay Yoyaku Yo (the platform) for their subscription plans.

## Overview

- **Purpose**: Shop owners pay Yoyaku Yo for subscription plans (Basic, Premium, Enterprise)
- **Payment Flow**: Stripe Checkout → Subscription → Recurring billing
- **Not for**: Customer-to-shop payments (bookings)

## Prerequisites

1. A Stripe account (sign up at https://stripe.com/register)
2. Access to your Stripe Dashboard (https://dashboard.stripe.com)

## Installation

Stripe has been installed in the backend. The package is already in `package.json`:

```json
"stripe": "^20.0.0"
```

## Environment Variables

Add the following environment variables to your `.env` file in `apps/api/`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe Secret Key (test or live)
STRIPE_WEBHOOK_SECRET=whsec_...  # Your Stripe Webhook Secret

# Subscription Plan Price IDs (from Stripe Dashboard)
STRIPE_PRICE_ID_BASIC=price_...  # Basic plan monthly price ID
STRIPE_PRICE_ID_PREMIUM=price_...  # Premium plan monthly price ID
STRIPE_PRICE_ID_ENTERPRISE=price_...  # Enterprise plan monthly price ID

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000  # or your production URL
```

### Getting Your Stripe Keys

1. **Secret Key (STRIPE_SECRET_KEY)**:
   - Go to https://dashboard.stripe.com/apikeys
   - Copy your "Secret key" (starts with `sk_test_` for test mode or `sk_live_` for live mode)
   - Use test keys during development

2. **Webhook Secret (STRIPE_WEBHOOK_SECRET)**:
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - Set endpoint URL to: `https://your-domain.com/subscriptions/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the "Signing secret" (starts with `whsec_`)

## Creating Subscription Products & Prices in Stripe

### Step 1: Create Products

1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
3. Create three products:

   **Basic Plan:**
   - Name: "Yoyaku Yo Basic Plan"
   - Description: "Basic subscription plan for shop owners"
   - Pricing: Recurring, Monthly, ¥5,000 JPY

   **Premium Plan:**
   - Name: "Yoyaku Yo Premium Plan"
   - Description: "Premium subscription plan for shop owners"
   - Pricing: Recurring, Monthly, ¥10,000 JPY

   **Enterprise Plan:**
   - Name: "Yoyaku Yo Enterprise Plan"
   - Description: "Enterprise subscription plan for shop owners"
   - Pricing: Recurring, Monthly, ¥20,000 JPY

### Step 2: Get Price IDs

1. After creating each product, click on it
2. Copy the "Price ID" (starts with `price_`)
3. Add them to your `.env` file:
   ```env
   STRIPE_PRICE_ID_BASIC=price_xxxxx
   STRIPE_PRICE_ID_PREMIUM=price_xxxxx
   STRIPE_PRICE_ID_ENTERPRISE=price_xxxxx
   ```

## Database Setup

The subscriptions route expects a `subscriptions` table in your Supabase database. Create it with this SQL:

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'premium', 'enterprise')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_checkout_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'past_due', 'canceled', 'unpaid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_owner_user_id ON subscriptions(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_shop_id ON subscriptions(shop_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
```

## API Endpoints

### 1. Create Checkout Session
**POST** `/subscriptions/create-checkout`

Request body:
```json
{
  "ownerUserId": "uuid-of-owner",
  "shopId": "uuid-of-shop",
  "plan": "basic"  // or "premium", "enterprise"
}
```

Response:
```json
{
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/pay/cs_test_xxx"
}
```

**Frontend Usage:**
```javascript
const response = await fetch('/api/subscriptions/create-checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ownerUserId: currentOwner.id,
    shopId: currentShop.id,
    plan: 'premium',
  }),
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe Checkout
```

### 2. Create Customer Portal Session
**POST** `/subscriptions/create-portal`

Request body:
```json
{
  "ownerUserId": "uuid-of-owner"
}
```

Response:
```json
{
  "url": "https://billing.stripe.com/p/session_xxx"
}
```

**Frontend Usage:**
```javascript
const response = await fetch('/api/subscriptions/create-portal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ownerUserId: currentOwner.id,
  }),
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe Customer Portal
```

### 3. Get Subscription Status
**GET** `/subscriptions/status/:ownerUserId`

Response:
```json
{
  "hasSubscription": true,
  "status": "active",
  "plan": "premium",
  "shopId": "uuid",
  "shopName": "My Shop",
  "currentPeriodEnd": "2024-02-29T00:00:00.000Z",
  "cancelAtPeriodEnd": false
}
```

### 4. Webhook Endpoint
**POST** `/subscriptions/webhook`

This endpoint receives events from Stripe. Make sure to:
- Set the webhook URL in Stripe Dashboard
- Use the webhook secret for signature verification
- Handle all subscription lifecycle events

## Subscription Status Flow

1. **Pending**: Checkout session created, payment not yet completed
2. **Active**: Subscription is active and paid
3. **Past Due**: Payment failed, subscription still active but needs attention
4. **Canceled**: Subscription was canceled
5. **Unpaid**: Subscription is unpaid and may be canceled

## Testing

### Test Cards

Use these test card numbers in Stripe test mode:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Any future expiry date and any 3-digit CVC will work.

### Testing Webhooks Locally

For local development, use Stripe CLI:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/subscriptions/webhook`
4. Copy the webhook signing secret and use it as `STRIPE_WEBHOOK_SECRET`

## Frontend Integration Example

```typescript
// Subscribe to a plan
async function subscribeToPlan(ownerUserId: string, shopId: string, plan: string) {
  const response = await fetch('/api/subscriptions/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerUserId, shopId, plan }),
  });
  
  const { url } = await response.json();
  window.location.href = url;
}

// Check subscription status
async function getSubscriptionStatus(ownerUserId: string) {
  const response = await fetch(`/api/subscriptions/status/${ownerUserId}`);
  return await response.json();
}

// Manage subscription (cancel, update payment method, etc.)
async function manageSubscription(ownerUserId: string) {
  const response = await fetch('/api/subscriptions/create-portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerUserId }),
  });
  
  const { url } = await response.json();
  window.location.href = url;
}
```

## Production Checklist

- [ ] Switch to live API keys (`sk_live_...`)
- [ ] Create live products and prices in Stripe Dashboard
- [ ] Update webhook URL to production domain
- [ ] Test subscription flow end-to-end
- [ ] Set up error monitoring
- [ ] Configure email notifications for failed payments
- [ ] Review Stripe Dashboard settings (business info, bank account, etc.)
- [ ] Set up subscription analytics and reporting

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Subscriptions: https://stripe.com/docs/billing/subscriptions/overview
- Stripe Customer Portal: https://stripe.com/docs/billing/subscriptions/integrating-customer-portal
- Stripe Support: https://support.stripe.com

