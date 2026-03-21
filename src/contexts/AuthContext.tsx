import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { User, LoginCredentials, RegisterCredentials, AuthContextType } from '../types/auth'
import { authenticateUser, registerUser, updateUserProfile, signOut, signInWithGoogle } from '../utils/auth'
import { supabase } from '../lib/supabase'

type ProfileRow = { id: string; email: string; first_name: string; last_name: string; created_at: string; avatar_url: string | null; currency: string | null }

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserFromSession = async (session: Session | null, isMounted: () => boolean) => {
    if (!session?.user) {
      if (isMounted()) { setUser(null); setLoading(false) }
      return
    }

    try {
      let result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      // For OAuth users (e.g. Google), create profile if it doesn't exist
      if (result.error && session.user.app_metadata?.provider !== 'email') {
        const meta = session.user.user_metadata
        const fullName: string = meta?.full_name ?? meta?.name ?? ''
        const [firstName = '', ...rest] = fullName.split(' ')
        const lastName = rest.join(' ')
        await supabase.from('profiles').insert({
          id: session.user.id,
          email: session.user.email ?? '',
          first_name: meta?.given_name ?? firstName,
          last_name: meta?.family_name ?? lastName,
          avatar_url: meta?.avatar_url ?? meta?.picture ?? null,
        })
        result = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
      }

      if (!isMounted()) return

      const profile = result.data as ProfileRow | null
      setUser(profile ? {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        createdAt: profile.created_at,
        avatarUrl: profile.avatar_url ?? undefined,
        currency: profile.currency ?? undefined,
      } : null)
    } finally {
      if (isMounted()) setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const isMounted = () => mounted

    // Directly read the stored session — does not rely on onAuthStateChange
    // firing INITIAL_SESSION, which can be missed in React StrictMode's
    // double-effect invocation (first subscription unsubscribes before the
    // second one is registered, so INITIAL_SESSION never fires again).
    supabase.auth.getSession()
      .then(({ data: { session } }) => loadUserFromSession(session, isMounted))
      .catch(() => { if (mounted) setLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        loadUserFromSession(session, isMounted)
      } else if (event === 'SIGNED_OUT') {
        if (mounted) { setUser(null); setLoading(false) }
      }
      // INITIAL_SESSION intentionally not handled here — getSession() above covers it
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (credentials: LoginCredentials): Promise<void> => {
    await authenticateUser(credentials)
    // onAuthStateChange fires SIGNED_IN and sets user state
  }

  const register = async (credentials: RegisterCredentials): Promise<void> => {
    await registerUser(credentials)
    // onAuthStateChange fires SIGNED_IN and sets user state
  }

  const loginWithGoogle = async (): Promise<void> => {
    await signInWithGoogle()
    // Supabase redirects to Google; onAuthStateChange handles the rest after redirect
  }

  const logout = async (): Promise<void> => {
    await signOut()
    // onAuthStateChange fires SIGNED_OUT and clears user state
  }

  const updateProfile = async (data: { firstName?: string; lastName?: string; avatarUrl?: string; currency?: string }): Promise<void> => {
    if (!user) return
    const updated = await updateUserProfile(user.id, data)
    if (updated) setUser(updated)
  }

  const value: AuthContextType = {
    user,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}