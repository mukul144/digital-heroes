import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function CharitiesPage({ searchParams }) {
  const { q = '', featured } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('charities')
    .select('id, name, description, image_url, featured')
    .order('name')
  if (q) query = query.ilike('name', `%${q}%`)
  if (featured === '1') query = query.eq('featured', true)
  const { data: charities } = await query

  const input = 'rounded-lg border border-gray-300 px-3 py-2'

  return (
    <main className="mx-auto max-w-5xl p-8 space-y-6">
      <h1 className="text-3xl font-bold">Charities you can support</h1>

      <form className="flex flex-wrap items-center gap-3">
        <input name="q" defaultValue={q} placeholder="Search by name" className={input} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" value="1" defaultChecked={featured === '1'} />
          Featured only
        </label>
        <button className="rounded-lg bg-black text-white px-4 py-2">Apply</button>
        <Link href="/charities" className="text-sm underline">Reset</Link>
      </form>

      {charities?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {charities.map((c) => (
            <Link
              key={c.id}
              href={`/charities/${c.id}`}
              className="overflow-hidden rounded-xl border transition hover:shadow-md"
            >
              {c.image_url ? (
                <img src={c.image_url} alt={c.name} className="h-40 w-full object-cover" />
              ) : (
                <div className="h-40 bg-gradient-to-br from-emerald-200 to-teal-400" />
              )}
              <div className="p-4 space-y-1">
                <h2 className="font-semibold">
                  {c.name}
                  {c.featured && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs">Featured</span>
                  )}
                </h2>
                <p className="line-clamp-2 text-sm text-gray-600">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No charities match your search.</p>
      )}
    </main>
  )
}