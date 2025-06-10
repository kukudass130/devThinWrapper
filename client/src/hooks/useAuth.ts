import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user || null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user || null)
      setLoading(false)

      // Handle token refresh for Gmail API
      if (event === 'TOKEN_REFRESHED' && session) {
        console.log('Token refreshed:', session.access_token)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    session,
    loading,
    signOut: async () => {
      await supabase.auth.signOut()
    }
  }
}
