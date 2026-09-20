'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  async function logout() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }
  return <button onClick={logout} className="rounded-lg border px-4 py-2">Log out</button>
}