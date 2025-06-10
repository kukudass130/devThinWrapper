import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://strjiukfgtwzonucwmec.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0cmppdWtmZ3R3em9udWN3bWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5ODYyMjYsImV4cCI6MjA2MzU2MjIyNn0.yuFp4Lmn03TqA4VRQpXPbBsaP-5bzFLPjHSAR9kjg9E'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/dashboard',
      scopes: [
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/gmail.modify',
      ].join(' '),
      queryParams: {
        access_type: 'offline',  // refresh token 확보
        prompt: 'consent',       // 항상 동의 화면 표시
      },
    }
  })
  
  if (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
  
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export const getCurrentUser = () => {
  return supabase.auth.getUser()
}

export const getSession = () => {
  return supabase.auth.getSession()
}