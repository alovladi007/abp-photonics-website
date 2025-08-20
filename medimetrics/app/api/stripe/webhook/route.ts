import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get('stripe-signature');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  
  let evt: Stripe.Event;
  
  try {
    evt = stripe.webhooks.constructEvent(raw, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e: any) {
    return new NextResponse(`Webhook Error: ${e.message}`, { status: 400 });
  }
  
  switch (evt.type) {
    case 'checkout.session.completed':
      // TODO: provision account, send welcome email
      console.log('Checkout session completed:', evt.data.object);
      break;
    case 'invoice.finalized':
      // TODO: record metered usage summary
      console.log('Invoice finalized:', evt.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${evt.type}`);
  }
  
  return NextResponse.json({ received: true });
}