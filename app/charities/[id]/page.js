import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function CharityPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: charity } = await supabase
    .from('charities')
    .select('*')
    .eq('id', id)
    .single()

  if (!charity) notFound()

  const events = Array.isArray(charity.events) ? charity.events : []

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <Link href="/charities" className="text-sm underline">← All charities</Link>

      {charity.image_url ? (
        <img src={charity.image_url} alt={charity.name} className="h-64 w-full rounded-xl object-cover" />
      ) : (
        <div className="h-64 rounded-xl bg-gradient-to-br from-emerald-200 to-teal-400" />
      )}

      <h1 className="text-3xl font-bold">{charity.name}</h1>
      <p className="text-gray-700">{charity.description}</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Upcoming events</h2>
        {events.length ? (
          <ul className="divide-y rounded-lg border">
            {events.map((e, i) => (
              <li key={i} className="px-4 py-3">
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-gray-500">{e.date} · {e.location}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No upcoming events yet.</p>
        )}
      </section>

      <Link href="/signup" className="inline-block rounded-lg bg-black px-5 py-3 text-white">
        Support this charity
      </Link>
    </main>
  )
}