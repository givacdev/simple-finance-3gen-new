import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature')!;
  const body = await request.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const userId = session.metadata.userId;

    // Dá acesso premium por 12 meses + 5 dias de tolerância
    const until = new Date();
    until.setMonth(until.getMonth() + 12);
    until.setDate(until.getDate() + 5); // tolerância

    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        premium: true,
        premium_until: until.toISOString(),
      },
    });
  }

  return NextResponse.json({ received: true });
}
