import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Notification } from '../types/group'
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../utils/notifications'
import { useAuth } from './AuthContext'

interface NotificationsContextValue {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refresh: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  refresh: async () => {},
})

export const useNotifications = () => useContext(NotificationsContext)

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])

  const refresh = useCallback(async () => {
    if (!user) return
    const data = await getUserNotifications(user.id)
    setNotifications(data)
  }, [user])

  // Initial load
  useEffect(() => {
    refresh()
  }, [refresh])

  // Supabase Realtime subscription — only for the current user's rows
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const newNotification: Notification = {
            id: row.id as string,
            userId: row.user_id as string,
            type: row.type as Notification['type'],
            title: row.title as string,
            body: row.body as string,
            groupId: (row.group_id as string | null) ?? undefined,
            actorId: (row.actor_id as string | null) ?? undefined,
            isRead: row.is_read as boolean,
            createdAt: row.created_at as string,
          }
          setNotifications(prev => [newNotification, ...prev])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          setNotifications(prev =>
            prev.map(n =>
              n.id === (row.id as string) ? { ...n, isRead: row.is_read as boolean } : n
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const markAsRead = useCallback(async (id: string) => {
    await markNotificationAsRead(id)
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)))
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!user) return
    await markAllNotificationsAsRead(user.id)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }, [user])

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, refresh }}>
      {children}
    </NotificationsContext.Provider>
  )
}
