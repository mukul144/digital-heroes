'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function ScoreManager({ userId, initialScores }) {
  const supabase = createClient()
  const [scores, setScores] = useState(initialScores)
  const [score, setScore] = useState('')
  const [date, setDate] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const today = new Date().toISOString().split('T')[0]

  async function refresh() {
    const { data } = await supabase
      .from('scores')
      .select('id, score, played_on')
      .eq('user_id', userId)
      .order('played_on', { ascending: false })
    setScores(data || [])
    return data || []
  }

  function reset() {
    setScore('')
    setDate('')
    setEditingId(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    const value = Number(score)
    if (!Number.isInteger(value) || value < 1 || value > 45) {
      setMessage('Score must be a whole number between 1 and 45.')
      return
    }
    if (!date || date > today) {
      setMessage('Pick a valid date (not in the future).')
      return
    }

    const query = editingId
      ? supabase.from('scores').update({ score: value, played_on: date }).eq('id', editingId)
      : supabase.from('scores').insert({ user_id: userId, score: value, played_on: date }).select('id')

    const { data, error } = await query
    if (error) {
      setMessage(
        error.code === '23505'
          ? 'You already have a score for this date. Edit or delete it instead.'
          : error.message
      )
      return
    }

    const list = await refresh()
    // A score older than your latest 5 is dropped automatically
    if (!editingId && data?.[0] && !list.some((s) => s.id === data[0].id)) {
      setMessage('Saved, but it is older than your latest 5 scores, so it was not kept.')
    }
    reset()
  }

  function startEdit(s) {
    setEditingId(s.id)
    setScore(String(s.score))
    setDate(s.played_on)
    setMessage('')
  }

  async function remove(id) {
    await supabase.from('scores').delete().eq('id', id)
    await refresh()
    if (editingId === id) reset()
  }

  const input = 'rounded-lg border border-gray-300 px-3 py-2'

  return (
    <section className="space-y-4 max-w-md">
      <h2 className="text-xl font-semibold">Your last 5 scores</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
        <input
          className={`${input} w-24`}
          type="number"
          min={1}
          max={45}
          placeholder="1-45"
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />
        <input
          className={input}
          type="date"
          max={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button className="rounded-lg bg-black text-white px-4 py-2">
          {editingId ? 'Update' : 'Add score'}
        </button>
        {editingId && (
          <button type="button" onClick={reset} className="rounded-lg border px-4 py-2">
            Cancel
          </button>
        )}
      </form>
      {message && <p className="text-sm text-red-600">{message}</p>}

      {scores.length === 0 ? (
        <p className="text-sm text-gray-500">No scores yet. Add your first one above.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {scores.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-4 py-3">
              <span>
                <strong className="text-lg">{s.score}</strong>
                <span className="ml-3 text-sm text-gray-500">{s.played_on}</span>
              </span>
              <span className="space-x-3 text-sm">
                <button onClick={() => startEdit(s)} className="underline">Edit</button>
                <button onClick={() => remove(s.id)} className="underline text-red-600">Delete</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}