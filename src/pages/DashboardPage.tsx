import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { GroupCard } from '../components/GroupCard';
import { EmptyState } from '../components/EmptyState';
import { CreateGroupModal, GroupFormData } from '../components/CreateGroupModal';
import { Group } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { getStoredGroups, saveGroup, createGroupDetails, getUserInvitations, acceptGroupInvitation, declineGroupInvitation, generateInviteCode } from '../utils/groups';
import { GroupInvitationCard } from '../components/GroupInvitationCard';
import { GroupInvitation } from '../types/group';
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
          currency: '€',
        },
        user.id
      );
      console.log('Group created with ID:', groupId);

      await createGroupDetails({ id: groupId, name: groupData.name, description: groupData.description, location: groupData.location, currency: '€', memberCount: 1, totalExpenses: 0, lastActivity: 'Just now', yourBalance: 0 }, user);
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

  const totalBalance = groups.reduce((sum, group) => sum + group.yourBalance, 0);
  const youOwe = groups.filter(g => g.yourBalance < 0).reduce((sum, g) => sum + Math.abs(g.yourBalance), 0);
  const youAreOwed = groups.filter(g => g.yourBalance > 0).reduce((sum, g) => sum + g.yourBalance, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onCreateGroup={handleCreateGroup}
        onJoinGroup={() => setIsJoinModalOpen(true)}
        onProfileClick={handleProfileClick}
        notificationCount={3}
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
            {groups.length} {groups.length === 1 ? 'group' : 'groups'}
          </div>
        </div>

        {groups.length === 0 ? (
          <EmptyState onCreateGroup={handleCreateGroup} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                {...group}
                onClick={handleGroupClick}
              />
            ))}
          </div>
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
    </div>
  );
};