import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as const,
});

export async function POST(request: Request) {
  const { priceId, userId } = await request.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'pix'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription', // ou 'payment' pra oferta única
    success_url: 'https://simple-finance-3gen-new.vercel.app/dashboard?success=true',
    cancel_url: 'https://simple-finance-3gen-new.vercel.app/dashboard?canceled=true',
    metadata: { userId },
  });

  return NextResponse.json({ url: session.url });
}
