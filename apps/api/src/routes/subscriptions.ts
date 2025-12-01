import express, { Request, Response, Router } from 'express';
import Stripe from 'stripe';
import { supabase } from '../lib/supabase';

const router = Router();

// Initialize Stripe with secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Subscription plan configuration
// These should match the Price IDs in your Stripe Dashboard
const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Plan',
    priceId: process.env.STRIPE_PRICE_ID_BASIC || '', // Monthly subscription price ID
    amount: 5000, // JPY per month
  },
  premium: {
    name: 'Premium Plan',
    priceId: process.env.STRIPE_PRICE_ID_PREMIUM || '', // Monthly subscription price ID
    amount: 10000, // JPY per month
  },
  enterprise: {
    name: 'Enterprise Plan',
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || '', // Monthly subscription price ID
    amount: 20000, // JPY per month
  },
};

// POST /subscriptions/create-checkout
// Create a Stripe Checkout Session for subscription
router.post('/create-checkout', async (req: Request, res: Response) => {
  try {
    const { ownerUserId, shopId, plan = 'basic' } = req.body;

    // Validate required fields
    if (!ownerUserId) {
      return res.status(400).json({ 
        error: 'Owner user ID is required.' 
      });
    }

    if (!shopId) {
      return res.status(400).json({ 
        error: 'Shop ID is required.' 
      });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];
    if (!selectedPlan) {
      return res.status(400).json({ 
        error: `Invalid plan. Available plans: ${Object.keys(SUBSCRIPTION_PLANS).join(', ')}` 
      });
    }

    if (!selectedPlan.priceId) {
      return res.status(500).json({ 
        error: `Price ID not configured for ${plan} plan. Please set STRIPE_PRICE_ID_${plan.toUpperCase()} in environment variables.` 
      });
    }

    // Get owner and shop info for metadata
    const { data: owner } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', ownerUserId)
      .single();

    const { data: shop } = await supabase
      .from('shops')
      .select('name')
      .eq('id', shopId)
      .single();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      customer_email: owner?.email || undefined,
      metadata: {
        owner_user_id: ownerUserId,
        shop_id: shopId,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          owner_user_id: ownerUserId,
          shop_id: shopId,
          plan: plan,
        },
      },
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/owner/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/owner/subscription/cancel`,
    });

    // Save checkout session to database
    try {
      await supabase
        .from('subscriptions')
        .insert({
          owner_user_id: ownerUserId,
          shop_id: shopId,
          plan: plan,
          stripe_checkout_session_id: session.id,
          status: 'pending',
        });
    } catch (dbError) {
      console.warn('Could not save checkout session to database:', dbError);
    }

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});

// POST /subscriptions/create-portal
// Create a Stripe Customer Portal session for managing subscription
router.post('/create-portal', async (req: Request, res: Response) => {
  try {
    const { ownerUserId } = req.body;

    if (!ownerUserId) {
      return res.status(400).json({ 
        error: 'Owner user ID is required.' 
      });
    }

    // Get the customer ID from subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('owner_user_id', ownerUserId)
      .eq('status', 'active')
      .single();

    if (!subscription?.stripe_customer_id) {
      return res.status(404).json({ 
        error: 'No active subscription found for this owner.' 
      });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/owner/subscription`,
    });

    res.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ 
      error: 'Failed to create portal session',
      message: error.message 
    });
  }
});

// GET /subscriptions/status/:ownerUserId
// Get subscription status for an owner
router.get('/status/:ownerUserId', async (req: Request, res: Response) => {
  try {
    const { ownerUserId } = req.params;

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*, shops(name)')
      .eq('owner_user_id', ownerUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !subscription) {
      return res.json({
        hasSubscription: false,
        status: 'none',
      });
    }

    // If subscription exists, get latest info from Stripe
    let stripeSubscription = null;
    if (subscription.stripe_subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        );
      } catch (stripeError) {
        console.warn('Could not retrieve Stripe subscription:', stripeError);
      }
    }

    res.json({
      hasSubscription: true,
      status: subscription.status,
      plan: subscription.plan,
      shopId: subscription.shop_id,
      shopName: subscription.shops?.name,
      currentPeriodEnd: stripeSubscription?.current_period_end 
        ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
        : null,
      cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end || false,
    });
  } catch (error: any) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ 
      error: 'Failed to get subscription status',
      message: error.message 
    });
  }
});

// POST /subscriptions/webhook
// Stripe webhook endpoint for subscription events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return res.status(400).send('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // Update subscription in database
          await supabase
            .from('subscriptions')
            .update({
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              status: subscription.status === 'active' ? 'active' : 'pending',
              plan: session.metadata?.plan || 'basic',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_checkout_session_id', session.id);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription ${event.type}:`, subscription.id);

        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status === 'active' ? 'active' : subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', subscription.id);

        // Mark subscription as canceled
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', invoice.id);

        if (invoice.subscription) {
          // Ensure subscription is marked as active
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', invoice.subscription as string);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment failed:', invoice.id);

        if (invoice.subscription) {
          // Mark subscription as past_due
          await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', invoice.subscription as string);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

export default router;

