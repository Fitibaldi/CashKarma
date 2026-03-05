import { supabase } from '../lib/supabase'
import { Group } from '../data/mockData';
import { GroupDetails, GroupMember, Payment, Settlement, GroupInvitation } from '../types/group';
import { User } from '../types/auth';
import { createNotification, createNotifications } from './notifications';

// ============================================================
// INTERNAL: compute member balances from payments + settlements
// ============================================================
interface RawMember {
  user_id: string
  role: string
  joined_at: string
  profiles: { id: string; first_name: string; last_name: string; email: string; avatar_url: string | null } | null
}

async function computeMemberBalances(groupId: string, members: RawMember[]): Promise<GroupMember[]> {
  const [paymentsResult, settlementsResult] = await Promise.all([
    supabase
      .from('payments')
      .select('from_user_id, amount, split_type, split_between')
      .eq('group_id', groupId),
    supabase
      .from('settlements')
      .select('from_user_id, to_user_id, amount')
      .eq('group_id', groupId)
  ])

  const payments = paymentsResult.data ?? []
  const settlements = settlementsResult.data ?? []

  const balanceMap: Record<string, { totalPaid: number; totalOwed: number; balance: number }> = {}
  members.forEach(m => { balanceMap[m.user_id] = { totalPaid: 0, totalOwed: 0, balance: 0 } })

  const memberIds = members.map(m => m.user_id)
  payments.forEach(p => {
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
  settlements.forEach(s => {
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
    avatarUrl: m.profiles?.avatar_url ?? undefined,
  }))
}

// ============================================================
// GROUPS
// ============================================================

function formatGroupDate(isoString: string): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return isoString
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

export async function getStoredGroups(userId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, role, joined_at, groups(id, name, description, avatar_url, location, currency, created_at, is_archived, is_deleted, created_by)')
    .eq('user_id', userId)

  if (error || !data) return []

  // Process groups in parallel instead of sequentially
  const groupPromises = data.map(async (row) => {
    const g = row.groups as unknown as { id: string; name: string; description: string; avatar_url: string | null; location: string; currency: string; created_at: string; is_archived: boolean; is_deleted: boolean; created_by: string } | null
    if (!g || g.is_deleted) return null

    try {
      // Parallelize all queries for this group
      const [memberCountResult, paymentsResult, memberRowsResult] = await Promise.all([
        supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', g.id),
        supabase
          .from('payments')
          .select('amount')
          .eq('group_id', g.id),
        supabase
          .from('group_members')
          .select('user_id, role, joined_at, profiles(id, first_name, last_name, email, avatar_url)')
          .eq('group_id', g.id)
      ])

      const memberCount = memberCountResult.count ?? 0
      const totalExpenses = (paymentsResult.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0)

      const memberBalances = await computeMemberBalances(g.id, (memberRowsResult.data ?? []) as RawMember[])
      const myBalance = memberBalances.find(m => m.id === userId)?.balance ?? 0

      return {
        id: g.id,
        name: g.name,
        description: g.description ?? '',
        memberCount,
        totalExpenses,
        currency: g.currency,
        lastActivity: formatGroupDate(g.created_at),
        avatarUrl: g.avatar_url ?? undefined,
        location: g.location ?? undefined,
        yourBalance: myBalance,
        isArchived: g.is_archived ?? false,
        createdBy: g.created_by,
      }
    } catch (err) {
      console.error(`Error loading group ${g.id}:`, err)
      return null
    }
  })

  const groups = await Promise.all(groupPromises)
  return groups.filter(g => g !== null) as Group[]
}

export async function saveGroup(
  group: Omit<Group, 'id' | 'memberCount' | 'totalExpenses' | 'lastActivity' | 'yourBalance'>,
  userId: string
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  console.log('saveGroup — session user id:', session?.user?.id, '| passed userId:', userId)
  const { data: authTest } = await supabase.rpc('test_auth')
  console.log('auth.uid() in DB:', authTest)

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
  const { data: rawGroup, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (error || !rawGroup) return null
  const group = rawGroup as { id: string; name: string; description: string; avatar_url: string | null; location: string; currency: string; created_by: string; created_at: string; is_archived: boolean }

  const { data: memberRows } = await supabase
    .from('group_members')
    .select('user_id, role, joined_at, profiles(id, first_name, last_name, email, avatar_url)')
    .eq('group_id', groupId)

  const members = await computeMemberBalances(groupId, (memberRows ?? []) as RawMember[])

  const { data: paymentRows } = await supabase
    .from('payments')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  type RawPayment = { id: string; from_user_id: string; from_user_name: string; to_user_id: string | null; amount: number; currency: string; description: string; date: string; method: string; status: string; split_type: 'equal' | 'specific'; split_between: string[] | null; paid_by: string; group_id: string; created_at: string; updated_at: string }
  const payments: Payment[] = ((paymentRows ?? []) as RawPayment[]).map(p => ({
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

  type RawSettlement = { id: string; group_id: string; from_user_id: string; to_user_id: string; amount: number; created_at: string }
  const settlements: Settlement[] = ((settlementRows ?? []) as RawSettlement[]).map(s => ({
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
    isArchived: group.is_archived ?? false,
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

export async function findPendingInvitationId(userId: string, groupId: string): Promise<string | null> {
  // No status filter: the upsert that resets status to 'pending' can be blocked by RLS
  // when the inviter ≠ the invited user. Accept/decline logic handles any existing row.
  const { data } = await supabase
    .from('group_invitations')
    .select('id')
    .eq('invited_user_id', userId)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>()
  return data?.id ?? null
}

export async function archiveGroup(groupId: string): Promise<boolean> {
  const { error } = await supabase
    .from('groups')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', groupId)
  if (error) return false

  const [groupRes, memberRows] = await Promise.all([
    supabase.from('groups').select('name, created_by').eq('id', groupId).single(),
    supabase.from('group_members').select('user_id').eq('group_id', groupId),
  ])
  const groupName = groupRes.data?.name ?? 'the group'
  const creatorId = groupRes.data?.created_by
  const others = (memberRows.data ?? [])
    .map(r => r.user_id as string)
    .filter(uid => uid !== creatorId)

  if (others.length > 0) {
    await createNotifications(
      others.map(uid => ({
        userId: uid,
        type: 'group_archived' as const,
        title: `"${groupName}" has been archived`,
        body: `The group "${groupName}" was archived. You can still view its history but no new payments or invitations are allowed.`,
        groupId,
        actorId: creatorId ?? undefined,
      }))
    )
  }
  return true
}

export async function softDeleteGroup(groupId: string): Promise<boolean> {
  const { error } = await supabase
    .from('groups')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', groupId)
  return !error
}

export async function requestLeaveGroup(
  groupId: string,
  userId: string
): Promise<'requested' | 'already_pending' | 'error'> {
  // Check for an existing pending request
  const { data: existing } = await supabase
    .from('group_leave_requests')
    .select('status')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()
  if (existing?.status === 'pending') return 'already_pending'

  const { error: reqError } = await supabase
    .from('group_leave_requests')
    .upsert({ group_id: groupId, user_id: userId, status: 'pending' }, { onConflict: 'group_id,user_id' })
  if (reqError) return 'error'

  const [groupRes, memberRes] = await Promise.all([
    supabase.from('groups').select('name, created_by').eq('id', groupId).single(),
    supabase.from('profiles').select('first_name, last_name').eq('id', userId).single(),
  ])
  const creatorId = (groupRes.data as { name: string; created_by: string } | null)?.created_by
  const groupName = (groupRes.data as { name: string } | null)?.name ?? 'your group'
  const memberName = memberRes.data
    ? `${memberRes.data.first_name} ${memberRes.data.last_name}`
    : 'A member'

  if (creatorId && creatorId !== userId) {
    await createNotification({
      userId: creatorId,
      type: 'leave_requested',
      title: `Leave request in ${groupName}`,
      body: `${memberName} wants to leave "${groupName}". Approve or decline their request.`,
      groupId,
      actorId: userId,
    })
  }
  return 'requested'
}

export async function approveLeaveRequest(groupId: string, leavingUserId: string): Promise<boolean> {
  // Remove leaving user from split_between on specific-split payments
  const { data: specificPayments } = await supabase
    .from('payments')
    .select('id, split_between')
    .eq('group_id', groupId)
    .eq('split_type', 'specific')

  const paymentsToUpdate = (specificPayments ?? []).filter(
    p => Array.isArray(p.split_between) && (p.split_between as string[]).includes(leavingUserId)
  )
  if (paymentsToUpdate.length > 0) {
    await Promise.all(
      paymentsToUpdate.map(p =>
        supabase
          .from('payments')
          .update({ split_between: (p.split_between as string[]).filter(id => id !== leavingUserId) })
          .eq('id', p.id)
      )
    )
  }

  await supabase
    .from('group_leave_requests')
    .update({ status: 'approved' })
    .eq('group_id', groupId)
    .eq('user_id', leavingUserId)

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', leavingUserId)

  if (error) return false

  const { data: groupRow } = await supabase.from('groups').select('name').eq('id', groupId).single()
  await createNotification({
    userId: leavingUserId,
    type: 'leave_request_approved',
    title: 'Leave request approved',
    body: `Your request to leave "${groupRow?.name ?? 'the group'}" has been approved.`,
    groupId,
  })
  return true
}

export async function removeGroupMember(groupId: string, removedUserId: string, removedByUserId: string): Promise<boolean> {
  // Remove user from split_between on specific-split payments (reuse same cleanup as approveLeaveRequest)
  const { data: specificPayments } = await supabase
    .from('payments')
    .select('id, split_between')
    .eq('group_id', groupId)
    .eq('split_type', 'specific')

  const paymentsToUpdate = (specificPayments ?? []).filter(
    p => Array.isArray(p.split_between) && (p.split_between as string[]).includes(removedUserId)
  )
  if (paymentsToUpdate.length > 0) {
    await Promise.all(
      paymentsToUpdate.map(p =>
        supabase
          .from('payments')
          .update({ split_between: (p.split_between as string[]).filter(id => id !== removedUserId) })
          .eq('id', p.id)
      )
    )
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', removedUserId)

  if (error) return false

  const [groupRes, removerRes] = await Promise.all([
    supabase.from('groups').select('name').eq('id', groupId).single(),
    supabase.from('profiles').select('first_name, last_name').eq('id', removedByUserId).single(),
  ])
  const groupName = groupRes.data?.name ?? 'the group'
  const removerName = removerRes.data
    ? `${removerRes.data.first_name} ${removerRes.data.last_name}`
    : 'The group creator'

  await createNotification({
    userId: removedUserId,
    type: 'member_removed',
    title: `You were removed from "${groupName}"`,
    body: `${removerName} removed you from the group "${groupName}".`,
    groupId,
    actorId: removedByUserId,
  })

  return true
}

export async function declineLeaveRequest(groupId: string, leavingUserId: string): Promise<boolean> {
  await supabase
    .from('group_leave_requests')
    .update({ status: 'declined' })
    .eq('group_id', groupId)
    .eq('user_id', leavingUserId)

  const { data: groupRow } = await supabase.from('groups').select('name').eq('id', groupId).single()
  await createNotification({
    userId: leavingUserId,
    type: 'leave_request_declined',
    title: 'Leave request declined',
    body: `Your request to leave "${groupRow?.name ?? 'the group'}" was declined by the group creator.`,
    groupId,
  })
  return true
}

export async function leaveGroup(groupId: string, userId: string): Promise<boolean> {
  // For specific-split payments, remove the leaving user from split_between
  // so remaining members absorb the full amount correctly
  const { data: specificPayments } = await supabase
    .from('payments')
    .select('id, split_between')
    .eq('group_id', groupId)
    .eq('split_type', 'specific')

  const paymentsToUpdate = (specificPayments ?? []).filter(
    p => Array.isArray(p.split_between) && (p.split_between as string[]).includes(userId)
  )

  if (paymentsToUpdate.length > 0) {
    await Promise.all(
      paymentsToUpdate.map(p =>
        supabase
          .from('payments')
          .update({ split_between: (p.split_between as string[]).filter(id => id !== userId) })
          .eq('id', p.id)
      )
    )
  }

  // Remove user from the group
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  return !error
}

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
    .upsert(rows, { onConflict: 'group_id,invited_user_id' })

  // Notify invited users
  const [groupRes, inviterRes] = await Promise.all([
    supabase.from('groups').select('name').eq('id', groupId).single(),
    supabase.from('profiles').select('first_name, last_name').eq('id', invitedBy).single(),
  ])
  const groupName = groupRes.data?.name ?? 'a group'
  const inviterName = inviterRes.data
    ? `${inviterRes.data.first_name} ${inviterRes.data.last_name}`
    : 'Someone'
  await createNotifications(
    userIds.map(uid => ({
      userId: uid,
      type: 'invitation_received' as const,
      title: `You were invited to ${groupName}`,
      body: `${inviterName} invited you to join "${groupName}"`,
      groupId,
      actorId: invitedBy,
    }))
  )
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
    .select('group_id, invited_user_id, invited_by')
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
    .insert({ group_id: inv.group_id, user_id: inv.invited_user_id, role: 'member' })

  // 23505 = unique_violation (already a member) — treat as success
  const ok = !memberError || memberError.code === '23505'
  if (!ok) return false

  // Notify the inviter and all other group members
  const [groupRes, accepterRes] = await Promise.all([
    supabase.from('groups').select('name').eq('id', inv.group_id).single(),
    supabase.from('profiles').select('first_name, last_name').eq('id', inv.invited_user_id).single(),
  ])
  const groupName = groupRes.data?.name ?? 'your group'
  const accepterName = accepterRes.data
    ? `${accepterRes.data.first_name} ${accepterRes.data.last_name}`
    : 'Someone'

  // Notify the original inviter
  await createNotifications([{
    userId: inv.invited_by,
    type: 'invitation_accepted',
    title: `${accepterName} joined ${groupName}`,
    body: `${accepterName} accepted your invitation to "${groupName}"`,
    groupId: inv.group_id,
    actorId: inv.invited_user_id,
  }])

  // Notify existing group members (excluding the inviter and the new member)
  const { data: memberRows } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', inv.group_id)
  const otherMembers = (memberRows ?? [])
    .map(r => r.user_id as string)
    .filter(uid => uid !== inv.invited_by && uid !== inv.invited_user_id)
  if (otherMembers.length > 0) {
    await createNotifications(
      otherMembers.map(uid => ({
        userId: uid,
        type: 'member_joined' as const,
        title: `New member in ${groupName}`,
        body: `${accepterName} joined "${groupName}"`,
        groupId: inv.group_id,
        actorId: inv.invited_user_id,
      }))
    )
  }

  return true
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
  const { data } = await supabase
    .from('invite_codes')
    .select('code')
    .eq('group_id', groupId)
    .maybeSingle<{ code: string }>()
  return data?.code ?? null
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
    .insert({ group_id: groupId, user_id: userId, role: 'member' })
  // 23505 = unique_violation (already a member) — treat as success
  if (error && error.code !== '23505') return false

  // Notify all existing members that someone joined
  const [groupRes, joinerRes] = await Promise.all([
    supabase.from('groups').select('name').eq('id', groupId).single(),
    supabase.from('profiles').select('first_name, last_name').eq('id', userId).single(),
  ])
  const groupName = groupRes.data?.name ?? 'your group'
  const joinerName = joinerRes.data
    ? `${joinerRes.data.first_name} ${joinerRes.data.last_name}`
    : 'Someone'
  const { data: memberRows } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
  const otherMembers = (memberRows ?? [])
    .map(r => r.user_id as string)
    .filter(uid => uid !== userId)
  if (otherMembers.length > 0) {
    await createNotifications(
      otherMembers.map(uid => ({
        userId: uid,
        type: 'member_joined' as const,
        title: `New member in ${groupName}`,
        body: `${joinerName} joined "${groupName}" via invite link`,
        groupId,
        actorId: userId,
      }))
    )
  }

  return true
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

  // Notify all group members except the one who added the payment
  const { data: memberRows } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
  const otherMembers = (memberRows ?? [])
    .map(r => r.user_id as string)
    .filter(uid => uid !== payment.fromUserId)
  if (otherMembers.length > 0) {
    const { data: groupRow } = await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single()
    await createNotifications(
      otherMembers.map(uid => ({
        userId: uid,
        type: 'payment_added' as const,
        title: `New expense in ${groupRow?.name ?? 'your group'}`,
        body: `${payment.fromUserName} added "${payment.description}" — ${payment.currency}${payment.amount.toFixed(2)}`,
        groupId,
        actorId: payment.fromUserId,
      }))
    )
  }
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

  // Notify all group members except the one who edited
  const { data: memberRows } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
  const otherMembers = (memberRows ?? [])
    .map(r => r.user_id as string)
    .filter(uid => uid !== payment.fromUserId)
  if (otherMembers.length > 0) {
    const { data: groupRow } = await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single()
    await createNotifications(
      otherMembers.map(uid => ({
        userId: uid,
        type: 'payment_edited' as const,
        title: `Expense updated in ${groupRow?.name ?? 'your group'}`,
        body: `${payment.fromUserName} edited "${payment.description}" — ${payment.currency}${payment.amount.toFixed(2)}`,
        groupId,
        actorId: payment.fromUserId,
      }))
    )
  }
}

export async function deletePaymentFromGroup(
  groupId: string,
  paymentId: string,
  deletedByUserId: string,
  deletedByName: string,
  paymentDescription: string,
  _currency: string
): Promise<void> {
  // Fetch members before deleting so we can notify them
  const { data: memberRows } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)

  const { data: groupRow } = await supabase
    .from('groups')
    .select('name')
    .eq('id', groupId)
    .single()

  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', paymentId)
    .eq('group_id', groupId)
  if (error) throw new Error(error.message)

  const otherMembers = (memberRows ?? [])
    .map(r => r.user_id as string)
    .filter(uid => uid !== deletedByUserId)
  if (otherMembers.length > 0) {
    await createNotifications(
      otherMembers.map(uid => ({
        userId: uid,
        type: 'payment_deleted' as const,
        title: `Expense removed in ${groupRow?.name ?? 'your group'}`,
        body: `${deletedByName} deleted "${paymentDescription}"`,
        groupId,
        actorId: deletedByUserId,
      }))
    )
  }
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

  // Notify the recipient of the settlement
  const [groupRes, payerRes] = await Promise.all([
    supabase.from('groups').select('name').eq('id', groupId).single(),
    supabase.from('profiles').select('first_name, last_name').eq('id', settlement.fromUserId).single(),
  ])
  const groupName = groupRes.data?.name ?? 'your group'
  const payerName = payerRes.data
    ? `${payerRes.data.first_name} ${payerRes.data.last_name}`
    : 'Someone'
  await createNotifications([{
    userId: settlement.toUserId,
    type: 'settlement_recorded',
    title: `Payment received in ${groupName}`,
    body: `${payerName} settled €${settlement.amount.toFixed(2)} with you in "${groupName}"`,
    groupId,
    actorId: settlement.fromUserId,
  }])
}

export async function getGroupSettlements(groupId: string): Promise<Settlement[]> {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  type RawSettlement = { id: string; group_id: string; from_user_id: string; to_user_id: string; amount: number; created_at: string }
  return (data as RawSettlement[]).map(s => ({
    id: s.id,
    groupId: s.group_id,
    fromUserId: s.from_user_id,
    toUserId: s.to_user_id,
    amount: Number(s.amount),
    createdAt: s.created_at,
  }))
}