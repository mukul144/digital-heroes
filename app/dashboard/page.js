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

  const { data: scores } = await supabase
    .from('scores')
    .select('id, score, played_on')
    .eq('user_id', user.id)
    .order('played_on', { ascending: false })

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Hello, {profile?.full_name}</h1>
      <p>Role: {profile?.role}</p>
      <p>Charity: {profile?.charities?.name} ({profile?.charity_percent}%)</p>
      <ScoreManager userId={user.id} initialScores={scores || []} />
      <LogoutButton />
    </main>
  )
}