import { supabase } from '../lib/supabase'
import { Group } from '../data/mockData';
import { GroupDetails, GroupMember, Payment, Settlement, GroupInvitation } from '../types/group';
import { User } from '../types/auth';

// ============================================================
// INTERNAL: compute member balances from payments + settlements
// ============================================================
interface RawMember {
  user_id: string
  role: string
  joined_at: string
  profiles: { id: string; first_name: string; last_name: string; email: string } | null
}

async function computeMemberBalances(groupId: string, members: RawMember[]): Promise<GroupMember[]> {
  const { data: payments } = await supabase
    .from('payments')
    .select('from_user_id, amount, split_type, split_between')
    .eq('group_id', groupId)

  const { data: settlements } = await supabase
    .from('settlements')
    .select('from_user_id, to_user_id, amount')
    .eq('group_id', groupId)

  const balanceMap: Record<string, { totalPaid: number; totalOwed: number; balance: number }> = {}
  members.forEach(m => { balanceMap[m.user_id] = { totalPaid: 0, totalOwed: 0, balance: 0 } })

  const memberIds = members.map(m => m.user_id)
  ;(payments ?? []).forEach(p => {
    const splitList: string[] = p.split_type === 'equal' ? memberIds : (p.split_between ?? [])
    const share = splitList.length > 0 ? p.amount / splitList.length : 0
    if (balanceMap[p.from_user_id]) {
      balanceMap[p.from_user_id].totalPaid += p.amount
      balanceMap[p.from_user_id].balance += p.amount
    }
    splitList.forEach((uid: string) => {
      if (balanceMap[uid]) {
        balanceMap[uid].totalOwed += share
        balanceMap[uid].balance -= share
      }
    })
  })
  ;(settlements ?? []).forEach(s => {
    if (balanceMap[s.from_user_id]) balanceMap[s.from_user_id].balance += s.amount
    if (balanceMap[s.to_user_id]) balanceMap[s.to_user_id].balance -= s.amount
  })

  return members.map(m => ({
    id: m.user_id,
    firstName: m.profiles?.first_name ?? '',
    lastName: m.profiles?.last_name ?? '',
    email: m.profiles?.email ?? '',
    joinedAt: m.joined_at,
    role: m.role as 'admin' | 'member',
    totalPaid: balanceMap[m.user_id]?.totalPaid ?? 0,
    totalOwed: balanceMap[m.user_id]?.totalOwed ?? 0,
    balance: balanceMap[m.user_id]?.balance ?? 0,
  }))
}

// ============================================================
// GROUPS
// ============================================================

export async function getStoredGroups(userId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, role, joined_at, groups(id, name, description, avatar_url, location, currency, created_at)')
    .eq('user_id', userId)

  if (error || !data) return []

  const result: Group[] = []
  for (const row of data) {
    const g = row.groups as { id: string; name: string; description: string; avatar_url: string | null; location: string; currency: string; created_at: string } | null
    if (!g) continue

    const { count: memberCount } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', g.id)

    const { data: expSum } = await supabase
      .from('payments')
      .select('amount')
      .eq('group_id', g.id)
    const totalExpenses = (expSum ?? []).reduce((sum, p) => sum + Number(p.amount), 0)

    const { data: memberRows } = await supabase
      .from('group_members')
      .select('user_id, role, joined_at, profiles(id, first_name, last_name, email)')
      .eq('group_id', g.id)

    const memberBalances = await computeMemberBalances(g.id, (memberRows ?? []) as RawMember[])
    const myBalance = memberBalances.find(m => m.id === userId)?.balance ?? 0

    result.push({
      id: g.id,
      name: g.name,
      description: g.description ?? '',
      memberCount: memberCount ?? 0,
      totalExpenses,
      currency: g.currency,
      lastActivity: g.created_at,
      avatarUrl: g.avatar_url ?? undefined,
      location: g.location ?? undefined,
      yourBalance: myBalance,
    })
  }
  return result
}

export async function saveGroup(
  group: Omit<Group, 'id' | 'memberCount' | 'totalExpenses' | 'lastActivity' | 'yourBalance'>,
  userId: string
): Promise<string> {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      name: group.name,
      description: group.description,
      avatar_url: group.avatarUrl ?? null,
      location: group.location ?? '',
      currency: group.currency,
      created_by: userId,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create group')
  return data.id
}

// ============================================================
// GROUP DETAILS
// ============================================================

export async function getStoredGroupDetails(groupId: string): Promise<GroupDetails | null> {
  const { data: group, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (error || !group) return null

  const { data: memberRows } = await supabase
    .from('group_members')
    .select('user_id, role, joined_at, profiles(id, first_name, last_name, email)')
    .eq('group_id', groupId)

  const members = await computeMemberBalances(groupId, (memberRows ?? []) as RawMember[])

  const { data: paymentRows } = await supabase
    .from('payments')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  const payments: Payment[] = (paymentRows ?? []).map(p => ({
    id: p.id,
    fromUserId: p.from_user_id,
    fromUserName: p.from_user_name,
    toUserId: p.to_user_id ?? undefined,
    amount: Number(p.amount),
    currency: p.currency,
    description: p.description,
    date: p.date,
    method: p.method,
    status: p.status,
    splitType: p.split_type,
    selectedMembers: p.split_between ?? [],
    splitBetween: p.split_between ?? [],
    paidBy: p.paid_by,
    groupId: p.group_id,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }))

  const { data: settlementRows } = await supabase
    .from('settlements')
    .select('*')
    .eq('group_id', groupId)

  const settlements: Settlement[] = (settlementRows ?? []).map(s => ({
    id: s.id,
    groupId: s.group_id,
    fromUserId: s.from_user_id,
    toUserId: s.to_user_id,
    amount: Number(s.amount),
    createdAt: s.created_at,
  }))

  const { data: creatorProfile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', group.created_by)
    .single()

  const totalExpenses = payments.reduce((sum, p) => sum + p.amount, 0)

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    avatarUrl: group.avatar_url ?? undefined,
    location: group.location,
    createdAt: group.created_at,
    createdBy: group.created_by,
    createdByName: creatorProfile
      ? `${creatorProfile.first_name} ${creatorProfile.last_name}`
      : 'Unknown',
    members,
    payments,
    settlements,
    totalExpenses,
    currency: group.currency,
  }
}

export async function createGroupDetails(group: Group, user: User): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'admin' })
  if (error) throw new Error(error.message)
}

// No-op kept for call-site compat — data is in normalised tables now
export async function saveGroupDetails(_groupId: string, _details: GroupDetails): Promise<void> {}

// ============================================================
// INVITATIONS
// ============================================================

export async function createGroupInvitations(
  groupId: string,
  userIds: string[],
  invitedBy: string
): Promise<void> {
  if (userIds.length === 0) return
  const rows = userIds.map(userId => ({
    group_id: groupId,
    invited_by: invitedBy,
    invited_user_id: userId,
    status: 'pending' as const,
  }))
  await supabase
    .from('group_invitations')
    .upsert(rows, { onConflict: 'group_id,invited_user_id', ignoreDuplicates: true })
}

export async function getUserInvitations(userId: string): Promise<GroupInvitation[]> {
  const { data, error } = await supabase
    .from('group_invitations')
    .select(`
      id, group_id, invited_by, invited_user_id, status, created_at, accepted_at,
      groups ( name, description ),
      profiles!group_invitations_invited_by_fkey ( first_name, last_name )
    `)
    .eq('invited_user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row: any) => ({
    id: row.id,
    groupId: row.group_id,
    groupName: row.groups?.name ?? '',
    groupDescription: row.groups?.description ?? '',
    invitedBy: row.invited_by,
    invitedByName: row.profiles
      ? `${row.profiles.first_name} ${row.profiles.last_name}`
      : 'Unknown',
    invitedUserId: row.invited_user_id,
    status: row.status,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at ?? undefined,
  }))
}

export async function acceptGroupInvitation(invitationId: string): Promise<boolean> {
  const { data: inv, error: fetchError } = await supabase
    .from('group_invitations')
    .select('group_id, invited_user_id')
    .eq('id', invitationId)
    .single()

  if (fetchError || !inv) return false

  const { error: updateError } = await supabase
    .from('group_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invitationId)

  if (updateError) return false

  const { error: memberError } = await supabase
    .from('group_members')
    .upsert(
      { group_id: inv.group_id, user_id: inv.invited_user_id, role: 'member' },
      { onConflict: 'group_id,user_id', ignoreDuplicates: true }
    )

  return !memberError
}

export async function declineGroupInvitation(invitationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_invitations')
    .update({ status: 'declined' })
    .eq('id', invitationId)
  return !error
}

// getUserAcceptedGroups is no longer needed — getStoredGroups returns all memberships
export async function getUserAcceptedGroups(_userId: string): Promise<Group[]> {
  return []
}

// ============================================================
// INVITE CODES
// ============================================================

export async function getInviteCodeForGroup(groupId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('invite_codes')
    .select('code')
    .eq('group_id', groupId)
    .single()
  if (error || !data) return null
  return data.code
}

export async function generateInviteCode(groupId: string): Promise<string> {
  const existing = await getInviteCodeForGroup(groupId)
  if (existing) return existing

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))

  const { error } = await supabase.from('invite_codes').insert({ group_id: groupId, code })
  if (error) throw new Error(error.message)
  return code
}

export async function joinGroupByCode(code: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('invite_codes')
    .select('group_id')
    .eq('code', code.toUpperCase())
    .single()
  if (error || !data) return false
  return joinGroupByInvite(data.group_id, userId)
}

export async function joinGroupByInvite(groupId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_members')
    .upsert(
      { group_id: groupId, user_id: userId, role: 'member' },
      { onConflict: 'group_id,user_id', ignoreDuplicates: true }
    )
  return !error
}

export async function getGroupByInviteId(groupId: string): Promise<Group | null> {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, description, avatar_url, location, currency')
    .eq('id', groupId)
    .single()
  if (error || !data) return null

  const { count: memberCount } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    memberCount: memberCount ?? 0,
    totalExpenses: 0,
    currency: data.currency,
    lastActivity: '',
    avatarUrl: data.avatar_url ?? undefined,
    location: data.location ?? undefined,
    yourBalance: 0,
  }
}

// ============================================================
// PAYMENTS
// ============================================================

export async function addPaymentToGroup(
  groupId: string,
  payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const { error } = await supabase.from('payments').insert({
    group_id: groupId,
    from_user_id: payment.fromUserId,
    from_user_name: payment.fromUserName,
    to_user_id: payment.toUserId ?? null,
    amount: payment.amount,
    currency: payment.currency,
    description: payment.description,
    date: payment.date,
    method: payment.method,
    status: payment.status,
    split_type: payment.splitType,
    split_between: payment.splitBetween,
    paid_by: payment.paidBy,
  })
  if (error) throw new Error(error.message)
}

export async function updatePaymentInGroup(
  groupId: string,
  paymentId: string,
  payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const { error } = await supabase
    .from('payments')
    .update({
      from_user_id: payment.fromUserId,
      from_user_name: payment.fromUserName,
      to_user_id: payment.toUserId ?? null,
      amount: payment.amount,
      currency: payment.currency,
      description: payment.description,
      date: payment.date,
      method: payment.method,
      status: payment.status,
      split_type: payment.splitType,
      split_between: payment.splitBetween,
      paid_by: payment.paidBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .eq('group_id', groupId)
  if (error) throw new Error(error.message)
}

// ============================================================
// SETTLEMENTS
// ============================================================

export async function addSettlementToGroup(
  groupId: string,
  settlement: Omit<Settlement, 'id' | 'createdAt'>
): Promise<void> {
  const { error } = await supabase.from('settlements').insert({
    group_id: groupId,
    from_user_id: settlement.fromUserId,
    to_user_id: settlement.toUserId,
    amount: settlement.amount,
  })
  if (error) throw new Error(error.message)
}

export async function getGroupSettlements(groupId: string): Promise<Settlement[]> {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(s => ({
    id: s.id,
    groupId: s.group_id,
    fromUserId: s.from_user_id,
    toUserId: s.to_user_id,
    amount: Number(s.amount),
    createdAt: s.created_at,
  }))
}