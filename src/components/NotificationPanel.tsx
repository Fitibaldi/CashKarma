import React, { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, CreditCard, UserPlus, Users, DollarSign, Pencil, Trash2, X, LogOut, Archive, UserMinus } from 'lucide-react'
import { useNotifications } from '../contexts/NotificationsContext'
import { useAuth } from '../contexts/AuthContext'
import { Notification, NotificationType } from '../types/group'
import { acceptGroupInvitation, declineGroupInvitation, findPendingInvitationId, approveLeaveRequest, declineLeaveRequest } from '../utils/groups'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLButtonElement>
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const iconMap: Record<NotificationType, React.ReactNode> = {
  payment_added:          <CreditCard className="w-4 h-4 text-blue-500" />,
  payment_edited:         <Pencil className="w-4 h-4 text-yellow-500" />,
  payment_deleted:        <Trash2 className="w-4 h-4 text-red-500" />,
  invitation_received:    <UserPlus className="w-4 h-4 text-purple-500" />,
  invitation_accepted:    <Check className="w-4 h-4 text-green-500" />,
  settlement_recorded:    <DollarSign className="w-4 h-4 text-emerald-500" />,
  member_joined:          <Users className="w-4 h-4 text-indigo-500" />,
  leave_requested:        <LogOut className="w-4 h-4 text-orange-500" />,
  leave_request_approved: <Check className="w-4 h-4 text-green-500" />,
  leave_request_declined: <X className="w-4 h-4 text-red-500" />,
  group_archived:         <Archive className="w-4 h-4 text-amber-500" />,
  member_removed:         <UserMinus className="w-4 h-4 text-red-500" />,
}

// These types navigate to the group when the row is clicked
const navigatableTypes: NotificationType[] = [
  'payment_added', 'payment_edited', 'payment_deleted',
  'invitation_accepted', 'settlement_recorded', 'member_joined',
  'leave_request_approved', 'leave_request_declined',
  'group_archived',
]

interface NotificationItemProps {
  notification: Notification
  onRead: (id: string) => void
  onClick?: () => void
  onAccept?: () => Promise<void>
  onDecline?: () => Promise<void>
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
  onClick,
  onAccept,
  onDecline,
}) => {
  const [busy, setBusy] = useState(false)
  const [handled, setHandled] = useState(false)
  const hasActions = notification.type === 'invitation_received' || notification.type === 'leave_requested'
  // leave_requested buttons always visible (creator may read it and still need to act); others hide once read
  const showActions = hasActions && !handled && onAccept && onDecline &&
    (notification.type === 'leave_requested' || !notification.isRead)

  const handleClick = () => {
    if (!notification.isRead) onRead(notification.id)
    onClick?.()
  }

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onAccept || busy) return
    setHandled(true)
    setBusy(true)
    await onAccept()
    setBusy(false)
  }

  const handleDecline = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDecline || busy) return
    setHandled(true)
    setBusy(true)
    await onDecline()
    setBusy(false)
  }

  return (
    <div className={`border-b border-gray-100 last:border-0 ${!notification.isRead ? 'bg-blue-50/40' : ''}`}>
      <button
        onClick={handleClick}
        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          {iconMap[notification.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm leading-snug ${!notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{notification.body}</p>
          <p className="text-xs text-gray-400 mt-1">{timeAgo(notification.createdAt)}</p>
        </div>
      </button>

      {showActions && (
        <div className="px-4 pb-3 flex gap-2 ml-11">
          <button
            onClick={handleAccept}
            disabled={busy}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Check className="w-3 h-3" />
            {notification.type === 'leave_requested' ? 'Approve' : 'Accept'}
          </button>
          <button
            onClick={handleDecline}
            disabled={busy}
            className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-3 h-3" />
            Decline
          </button>
        </div>
      )}
    </div>
  )
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, anchorRef }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications()
  const { user } = useAuth()
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, onClose, anchorRef])

  const handleNotificationClick = (n: Notification) => {
    if (!n.groupId) return
    if (!n.isRead) markAsRead(n.id)
    onClose()
    navigate(`/group/${n.groupId}`)
  }

  const handleAccept = async (n: Notification) => {
    if (!n.groupId || !user) return
    const invId = await findPendingInvitationId(user.id, n.groupId)
    if (!invId) return
    const success = await acceptGroupInvitation(invId)
    if (success) {
      markAsRead(n.id)
      refresh()
      onClose()
      navigate(`/group/${n.groupId}`)
    }
  }

  const handleDecline = async (n: Notification) => {
    if (!n.groupId || !user) return
    const invId = await findPendingInvitationId(user.id, n.groupId)
    if (!invId) return
    await declineGroupInvitation(invId)
    markAsRead(n.id)
    refresh()
  }

  const handleApproveLeave = async (n: Notification) => {
    if (!n.groupId || !n.actorId) return
    const success = await approveLeaveRequest(n.groupId, n.actorId)
    if (success) {
      markAsRead(n.id)
      refresh()
    }
  }

  const handleDeclineLeave = async (n: Notification) => {
    if (!n.groupId || !n.actorId) return
    await declineLeaveRequest(n.groupId, n.actorId)
    markAsRead(n.id)
    refresh()
  }

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
      style={{ maxHeight: '80vh' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-700" />
          <span className="font-semibold text-gray-900 text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 56px)' }}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Bell className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={markAsRead}
              onClick={navigatableTypes.includes(n.type) && n.groupId ? () => handleNotificationClick(n) : undefined}
              onAccept={
                n.type === 'invitation_received' ? () => handleAccept(n) :
                n.type === 'leave_requested' ? () => handleApproveLeave(n) :
                undefined
              }
              onDecline={
                n.type === 'invitation_received' ? () => handleDecline(n) :
                n.type === 'leave_requested' ? () => handleDeclineLeave(n) :
                undefined
              }
            />
          ))
        )}
      </div>
    </div>
  )
}
