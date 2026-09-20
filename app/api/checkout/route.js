import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/utils/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Please log in first.' }, { status: 401 })
  }

  const { plan } = await request.json()
  const price = plan === 'yearly' ? process.env.STRIPE_PRICE_YEARLY : process.env.STRIPE_PRICE_MONTHLY
  const origin = new URL(request.url).origin

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${origin}/dashboard?subscribed=1`,
    cancel_url: `${origin}/subscribe`,
  })

  return NextResponse.json({ url: session.url })
}