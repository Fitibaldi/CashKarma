import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { GroupCard } from '../components/GroupCard';
import { EmptyState } from '../components/EmptyState';
import { CreateGroupModal, GroupFormData } from '../components/CreateGroupModal';
import { InviteMembersModal } from '../components/InviteMembersModal';
import { AddPaymentModal } from '../components/AddPaymentModal';
import { Group } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { getStoredGroups, saveGroup, createGroupDetails, getUserInvitations, acceptGroupInvitation, declineGroupInvitation, generateInviteCode, archiveGroup, softDeleteGroup, requestLeaveGroup, getStoredGroupDetails, createGroupInvitations, addPaymentToGroup } from '../utils/groups';
import { GroupInvitationCard } from '../components/GroupInvitationCard';
import { GroupDetails, GroupInvitation, Payment } from '../types/group';
import { UserProfileModal } from '../components/UserProfileModal';
import { JoinGroupModal } from '../components/JoinGroupModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);

  // Modals opened from group card quick actions
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [activeGroupDetails, setActiveGroupDetails] = useState<GroupDetails | null>(null);

  const loadData = async (userId: string) => {
    const [allGroups, userInvitations] = await Promise.all([
      getStoredGroups(userId),
      getUserInvitations(userId),
    ]);
    setGroups(allGroups);
    setInvitations(userInvitations.filter(inv => inv.status === 'pending'));
  };

  useEffect(() => {
    if (user) loadData(user.id);
  }, [user]);

  const handleGroupClick = (groupId: string) => {
    navigate(`/group/${groupId}`);
  };

  const handleCreateGroup = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateGroupSubmit = async (groupData: GroupFormData) => {
    if (!user) return;
    try {
      console.log('Creating group:', groupData.name, '| user.id:', user.id);
      const groupId = await saveGroup(
        {
          name: groupData.name,
          description: groupData.description,
          location: groupData.location,
          currency: user.currency ?? '€',
          avatarUrl: groupData.emoji || undefined,
        },
        user.id
      );
      console.log('Group created with ID:', groupId);

      await createGroupDetails({ id: groupId, name: groupData.name, description: groupData.description, location: groupData.location, currency: user.currency ?? '€', memberCount: 1, totalExpenses: 0, lastActivity: 'Just now', yourBalance: 0 }, user);
      console.log('Group details created');

      await generateInviteCode(groupId);
      console.log('Invite code generated');

      await loadData(user.id);
      console.log('Groups reloaded');
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    const success = await acceptGroupInvitation(invitationId);
    if (success && user) await loadData(user.id);
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    await declineGroupInvitation(invitationId);
    if (user) {
      const userInvitations = await getUserInvitations(user.id);
      setInvitations(userInvitations.filter(inv => inv.status === 'pending'));
    }
  };

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
  };

  const refreshGroups = async () => {
    if (user) await loadData(user.id);
  };

  const handleArchiveGroup = async (groupId: string) => {
    await archiveGroup(groupId);
    if (user) await loadData(user.id);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('Delete this group? It will no longer be visible to anyone.')) return;
    await softDeleteGroup(groupId);
    if (user) await loadData(user.id);
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;
    const result = await requestLeaveGroup(groupId, user.id);
    if (result === 'already_pending') {
      alert('Your leave request is already pending. The group creator will review it.');
    } else if (result === 'requested') {
      alert('Your request has been sent to the group creator for review.');
    }
  };

  const openInviteModal = async (groupId: string) => {
    const details = await getStoredGroupDetails(groupId);
    if (!details) return;
    setActiveGroupDetails(details);
    setIsInviteModalOpen(true);
  };

  const openAddPaymentModal = async (groupId: string) => {
    const details = await getStoredGroupDetails(groupId);
    if (!details) return;
    setActiveGroupDetails(details);
    setIsAddPaymentModalOpen(true);
  };

  const handleInviteUsers = async (userIds: string[]) => {
    if (!activeGroupDetails) return;
    await createGroupInvitations(activeGroupDetails.id, userIds, user?.id || '');
  };

  const handleSavePayment = async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!activeGroupDetails) return;
    await addPaymentToGroup(activeGroupDetails.id, paymentData);
    if (user) await loadData(user.id);
  };

  const activeGroups = groups.filter(g => !g.isArchived).sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
  const archivedGroups = groups.filter(g => g.isArchived).sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));

  const totalBalance = activeGroups.reduce((sum, group) => sum + group.yourBalance, 0);
  const youOwe = activeGroups.filter(g => g.yourBalance < 0).reduce((sum, g) => sum + Math.abs(g.yourBalance), 0);
  const youAreOwed = activeGroups.filter(g => g.yourBalance > 0).reduce((sum, g) => sum + g.yourBalance, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onCreateGroup={handleCreateGroup}
        onJoinGroup={() => setIsJoinModalOpen(true)}
        onProfileClick={handleProfileClick}
        user={user}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's your expense overview and group activity
          </p>
        </div>

        {/* Balance Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Balance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">€{Math.abs(totalBalance).toFixed(2)}</div>
              <div className={`text-sm ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalBalance >= 0 ? 'You are owed' : 'You owe'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">€{youOwe.toFixed(2)}</div>
              <div className="text-sm text-gray-500">You owe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">€{youAreOwed.toFixed(2)}</div>
              <div className="text-sm text-gray-500">You are owed</div>
            </div>
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Pending Invitations</h2>
              <div className="text-sm text-gray-500">
                {invitations.length} {invitations.length === 1 ? 'invitation' : 'invitations'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {invitations.map((invitation) => (
                <GroupInvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onAccept={handleAcceptInvitation}
                  onDecline={handleDeclineInvitation}
                />
              ))}
            </div>
          </>
        )}

        {/* Groups Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Groups</h2>
          <div className="text-sm text-gray-500">
            {activeGroups.length} {activeGroups.length === 1 ? 'group' : 'groups'}
          </div>
        </div>

        {activeGroups.length === 0 && archivedGroups.length === 0 ? (
          <EmptyState onCreateGroup={handleCreateGroup} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeGroups.map((group) => (
              <GroupCard
                key={group.id}
                {...group}
                isOwner={group.createdBy === user?.id}
                onClick={handleGroupClick}
                onArchive={group.createdBy === user?.id ? handleArchiveGroup : undefined}
                onInvite={group.createdBy === user?.id ? openInviteModal : undefined}
                onAddPayment={openAddPaymentModal}
                onLeaveGroup={group.createdBy !== user?.id ? handleLeaveGroup : undefined}
              />
            ))}
          </div>
        )}

        {/* Archived Groups Section */}
        {archivedGroups.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-10 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Archived Groups</h2>
              <div className="text-sm text-gray-500">
                {archivedGroups.length} {archivedGroups.length === 1 ? 'group' : 'groups'}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  {...group}
                  isOwner={group.createdBy === user?.id}
                  onClick={handleGroupClick}
                  onDelete={group.createdBy === user?.id ? handleDeleteGroup : undefined}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGroup={handleCreateGroupSubmit}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <JoinGroupModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoined={refreshGroups}
      />

      {activeGroupDetails && (
        <>
          <InviteMembersModal
            isOpen={isInviteModalOpen}
            onClose={() => { setIsInviteModalOpen(false); setActiveGroupDetails(null); }}
            groupId={activeGroupDetails.id}
            groupName={activeGroupDetails.name}
            currentMembers={activeGroupDetails.members.map(m => m.id)}
            onInviteUsers={handleInviteUsers}
          />

          <AddPaymentModal
            isOpen={isAddPaymentModalOpen}
            onClose={() => { setIsAddPaymentModalOpen(false); setActiveGroupDetails(null); }}
            groupId={activeGroupDetails.id}
            members={activeGroupDetails.members}
            currency={activeGroupDetails.currency}
            currentUserId={user?.id || ''}
            onAddPayment={handleSavePayment}
          />
        </>
      )}
    </div>
  );
};
