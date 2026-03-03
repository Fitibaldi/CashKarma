import React, { useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, CreditCard, UserPlus, Users, DollarSign, Pencil, Trash2 } from 'lucide-react'
import { useNotifications } from '../contexts/NotificationsContext'
import { Notification, NotificationType } from '../types/group'

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
  payment_added:      <CreditCard className="w-4 h-4 text-blue-500" />,
  payment_edited:     <Pencil className="w-4 h-4 text-yellow-500" />,
  payment_deleted:    <Trash2 className="w-4 h-4 text-red-500" />,
  invitation_received:<UserPlus className="w-4 h-4 text-purple-500" />,
  invitation_accepted:<Check className="w-4 h-4 text-green-500" />,
  settlement_recorded:<DollarSign className="w-4 h-4 text-emerald-500" />,
  member_joined:      <Users className="w-4 h-4 text-indigo-500" />,
}

const NotificationItem: React.FC<{ notification: Notification; onRead: (id: string) => void }> = ({
  notification,
  onRead,
}) => (
  <button
    onClick={() => !notification.isRead && onRead(notification.id)}
    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
      !notification.isRead ? 'bg-blue-50/40' : ''
    }`}
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
)

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, anchorRef }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
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
            <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
          ))
        )}
      </div>
    </div>
  )
}
