import { supabase } from '../lib/supabase'
import { Notification, NotificationType } from '../types/group'

// ============================================================
// READ
// ============================================================

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return []

  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    groupId: row.group_id ?? undefined,
    actorId: row.actor_id ?? undefined,
    isRead: row.is_read,
    createdAt: row.created_at,
  }))
}

// ============================================================
// CREATE
// ============================================================

export async function createNotification(payload: {
  userId: string
  type: NotificationType
  title: string
  body: string
  groupId?: string
  actorId?: string
}): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    group_id: payload.groupId ?? null,
    actor_id: payload.actorId ?? null,
  })
}

/** Notify multiple users at once. Skips duplicates silently. */
export async function createNotifications(
  payloads: Array<{
    userId: string
    type: NotificationType
    title: string
    body: string
    groupId?: string
    actorId?: string
  }>
): Promise<void> {
  if (payloads.length === 0) return
  await supabase.from('notifications').insert(
    payloads.map(p => ({
      user_id: p.userId,
      type: p.type,
      title: p.title,
      body: p.body,
      group_id: p.groupId ?? null,
      actor_id: p.actorId ?? null,
    }))
  )
}

// ============================================================
// MARK AS READ
// ============================================================

export async function markNotificationAsRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id)
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
}
