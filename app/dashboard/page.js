import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LogoutButton from './LogoutButton'
import ScoreManager from './ScoreManager'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, charity_percent, charities(name)')
    .eq('id', user.id)
    .single()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Checked on every request, so lapsed or cancelled users lose access immediately
  const isActive =
    sub?.status === 'active' &&
    (!sub.current_period_end || new Date(sub.current_period_end) > new Date())

  const { data: scores } = await supabase
    .from('scores')
    .select('id, score, played_on')
    .eq('user_id', user.id)
    .order('played_on', { ascending: false })

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <h1 className="text-3xl font-bold">Hello, {profile?.full_name}</h1>

      <section className="rounded-xl border p-4 space-y-1">
        <h2 className="font-semibold">Subscription</h2>
        {isActive ? (
          <p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-sm text-emerald-800">Active</span>{' '}
            {sub.plan} plan
            {sub.current_period_end && <> · renews {new Date(sub.current_period_end).toLocaleDateString()}</>}
          </p>
        ) : (
          <p>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-sm text-gray-800">
              {sub ? sub.status : 'Not subscribed'}
            </span>{' '}
            <Link href="/subscribe" className="underline">Subscribe to unlock scores and draws</Link>
          </p>
        )}
      </section>

      <p>Charity: {profile?.charities?.name} ({profile?.charity_percent}%)</p>

      {isActive ? (
        <ScoreManager userId={user.id} initialScores={scores || []} />
      ) : (
        <p className="text-gray-500">Score entry and draws are available to subscribers only.</p>
      )}

      <LogoutButton />
    </main>
  )
}