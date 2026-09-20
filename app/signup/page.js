'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function SignupPage() {
  const supabase = createClient()
  const router = useRouter()
  const [charities, setCharities] = useState([])
  const [form, setForm] = useState({ name: '', email: '', password: '', charityId: '', percent: 10 })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('charities').select('id,name').then(({ data }) => {
      setCharities(data || [])
      if (data?.[0]) setForm((f) => ({ ...f, charityId: data[0].id }))
    })
  }, [])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    if (data.session) {
      await supabase
        .from('profiles')
        .update({ charity_id: form.charityId, charity_percent: Number(form.percent) })
        .eq('id', data.user.id)
      router.push('/dashboard')
      router.refresh()
    } else {
      setError('Account created. Please confirm your email, then log in.')
      setLoading(false)
    }
  }

  const input = 'w-full rounded-lg border border-gray-300 px-3 py-2'

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <input className={input} placeholder="Full name" required value={form.name} onChange={set('name')} />
        <input className={input} type="email" placeholder="Email" required value={form.email} onChange={set('email')} />
        <input className={input} type="password" placeholder="Password (min 6 characters)" minLength={6} required value={form.password} onChange={set('password')} />
        <label className="block text-sm font-medium">Choose a charity</label>
        <select className={input} value={form.charityId} onChange={set('charityId')}>
          {charities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className="block text-sm font-medium">Charity share of your fee (min 10%)</label>
        <input className={input} type="number" min={10} max={100} value={form.percent} onChange={set('percent')} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={loading} className="w-full rounded-lg bg-black text-white py-2">
          {loading ? 'Creating...' : 'Sign up'}
        </button>
        <p className="text-sm">Already have an account? <Link href="/login" className="underline">Log in</Link></p>
      </form>
    </main>
  )
}