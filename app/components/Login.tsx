import { useOutletContext } from '@remix-run/react'
import type { OutletContext } from '~/root'

export function Login() {
  const { supabase } = useOutletContext<OutletContext>()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    })

    if (error) {
      console.error(error)
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error(error)
    }
  }

  return (
    <div>
      <h1>Login</h1>
      <button onClick={handleLogin}>Login with GitHub</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
