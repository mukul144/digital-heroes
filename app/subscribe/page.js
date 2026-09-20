'use client'
import { useState } from 'react'
import Link from 'next/link'

const PLANS = [
  { id: 'monthly', name: 'Monthly', price: '₹499 / month', note: 'Cancel anytime' },
  { id: 'yearly', name: 'Yearly', price: '₹4,999 / year', note: 'Best value: 2 months free' },
]

export default function SubscribePage() {
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')

  async function choose(plan) {
    setLoading(plan)
    setError('')
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setError(data.error || 'Something went wrong.')
      setLoading('')
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <h1 className="text-3xl font-bold">Choose your plan</h1>
      <p className="text-gray-600">Enter your scores, join the monthly draw and support a charity you care about.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((p) => (
          <div key={p.id} className="rounded-xl border p-6 space-y-3">
            <h2 className="text-xl font-semibold">{p.name}</h2>
            <p className="text-2xl font-bold">{p.price}</p>
            <p className="text-sm text-gray-500">{p.note}</p>
            <button
              onClick={() => choose(p.id)}
              disabled={!!loading}
              className="w-full rounded-lg bg-black py-2 text-white disabled:opacity-60"
            >
              {loading === p.id ? 'Redirecting...' : `Subscribe ${p.name.toLowerCase()}`}
            </button>
          </div>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-600">
          {error} <Link href="/login" className="underline">Log in</Link>
        </p>
      )}
    </main>
  )
}