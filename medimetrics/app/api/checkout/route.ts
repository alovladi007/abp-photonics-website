import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const plan = new URL(req.url).searchParams.get('plan') || 'starter';
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const nickname = plan === 'pro' ? 'pro-monthly' : 'starter-monthly';
  
  try {
    const prices = await stripe.prices.search({ query: `active:'true' AND nickname:'${nickname}'` });
    const price = prices.data[0];
    
    if (!price) {
      return NextResponse.json({ error: 'Price not found' }, { status: 404 });
    }
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${process.env.BASE_URL}/pricing?success=1`,
      cancel_url: `${process.env.BASE_URL}/pricing?cancelled=1`,
      allow_promotion_codes: true
    });
    
    return NextResponse.redirect(session.url!, { status: 303 });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}