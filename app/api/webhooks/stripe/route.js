import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/utils/supabase/admin'

export const runtime = 'nodejs'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function mapStatus(status) {
  if (status === 'active' || status === 'trialing') return 'active'
  if (status === 'canceled') return 'cancelled'
  return 'lapsed' // past_due, unpaid, incomplete_expired...
}

async function saveSubscription(sub, userId) {
  const admin = createAdminClient()
  const item = sub.items.data[0]
  const price = item.price
  const periodEnd = sub.current_period_end ?? item.current_period_end

  const { error } = await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      plan: price.recurring?.interval === 'year' ? 'yearly' : 'monthly',
      status: mapStatus(sub.status),
      amount: (price.unit_amount ?? 0) / 100,
      stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
      stripe_subscription_id: sub.id,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    },
    { onConflict: 'stripe_subscription_id' }
  )
  if (error) throw error
}

export async function POST(request) {
  const body = await request.text() // raw body is required to verify the signature
  const signature = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${err.message}` }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      if (session.mode === 'subscription' && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription)
        await saveSubscription(sub, session.client_reference_id || sub.metadata.user_id)
      }
    } else if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const sub = event.data.object
      if (sub.metadata?.user_id) await saveSubscription(sub, sub.metadata.user_id)
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}