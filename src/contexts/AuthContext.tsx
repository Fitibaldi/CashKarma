import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
          return
        }

        if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
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

            const profile = result.data as ProfileRow | null
            if (profile) {
              setUser({
                id: profile.id,
                email: profile.email,
                firstName: profile.first_name,
                lastName: profile.last_name,
                createdAt: profile.created_at,
                avatarUrl: profile.avatar_url ?? undefined,
                currency: profile.currency ?? undefined,
              })
            }
          } finally {
            setLoading(false)
          }
          return
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
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