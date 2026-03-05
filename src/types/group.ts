export interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
  role: 'admin' | 'member';
  totalPaid: number;
  totalOwed: number;
  balance: number;
  avatarUrl?: string;
}

export interface Payment {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId?: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  method: string;
  status: string;
  splitType: 'equal' | 'specific';
  selectedMembers: string[];
  splitBetween: string[];
  paidBy: string;
  groupId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  createdAt: string;
}

export interface GroupDetails {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  location: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  members: GroupMember[];
  payments: Payment[];
  settlements?: Settlement[];
  totalExpenses: number;
  currency: string;
  isArchived: boolean;
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  groupDescription: string;
  invitedBy: string;
  invitedByName: string;
  invitedUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  acceptedAt?: string;
}

export type NotificationType =
  | 'payment_added'
  | 'payment_edited'
  | 'payment_deleted'
  | 'invitation_received'
  | 'invitation_accepted'
  | 'settlement_recorded'
  | 'member_joined'
  | 'leave_requested'
  | 'leave_request_approved'
  | 'leave_request_declined'
  | 'group_archived';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  groupId?: string;
  actorId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DebtDetail {
  fromUserId: string;
  fromUserName: string;
  fromUserAvatarUrl?: string;
  toUserId: string;
  toUserName: string;
  toUserAvatarUrl?: string;
  amount: number;
  currency: string;
}
