import { supabase } from '../lib/supabase'
import { User, LoginCredentials, RegisterCredentials } from '../types/auth'

// Maps a profiles row to the app's User type
function rowToUser(row: {
  id: string
  email: string
  first_name: string
  last_name: string
  avatar_url: string | null
  created_at: string
}): User {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    createdAt: row.created_at,
    avatarUrl: row.avatar_url ?? undefined,
  }
}

export async function authenticateUser(credentials: LoginCredentials): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })
  if (error) throw new Error(error.message)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) throw new Error('Failed to load user profile')
  return rowToUser(profile)
}

export async function registerUser(credentials: RegisterCredentials): Promise<User> {
  if (credentials.password !== credentials.confirmPassword) {
    throw new Error('Passwords do not match')
  }

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        first_name: credentials.firstName,
        last_name: credentials.lastName,
      },
    },
  })
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Registration failed')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) throw new Error('Failed to load profile after registration')
  return rowToUser(profile)
}

export async function updateUserProfile(
  userId: string,
  data: { firstName?: string; lastName?: string; avatarUrl?: string }
): Promise<User | null> {
  const updates: Record<string, string> = {}
  if (data.firstName !== undefined) updates.first_name = data.firstName
  if (data.lastName !== undefined) updates.last_name = data.lastName
  if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .single()

  if (error || !profile) return null
  return rowToUser(profile)
}

export async function getUserById(id: string): Promise<User | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !profile) return null
  return rowToUser(profile)
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('first_name')

  if (error || !data) return []
  return data.map(rowToUser)
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}