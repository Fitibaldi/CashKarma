import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GroupDetailsHeader } from '../components/GroupDetailsHeader';
import { InviteMembersModal } from '../components/InviteMembersModal';
import { AddPaymentModal } from '../components/AddPaymentModal';
import { DebtSummary } from '../components/DebtSummary';
import { SettleDebtModal } from '../components/SettleDebtModal';
import { MembersList } from '../components/MembersList';
import { PaymentHistory } from '../components/PaymentHistory';
import { getStoredGroupDetails, createGroupInvitations, addPaymentToGroup, updatePaymentInGroup, addSettlementToGroup, archiveGroup, leaveGroup } from '../utils/groups';
import { DebtDetail, GroupDetails, Payment, Settlement } from '../types/group';
import { useAuth } from '../contexts/AuthContext';
import { optimizeDebts } from '../utils/debtOptimization';

export const GroupDetailsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [settlingDebt, setSettlingDebt] = useState<DebtDetail | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDetails = async () => {
    if (!groupId) return;
    const details = await getStoredGroupDetails(groupId);
    setGroupDetails(details);
    setLoading(false);
  };

  useEffect(() => {
    loadDetails();
  }, [groupId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!groupDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Group not found</h1>
          <p className="text-gray-600 mb-4">The group you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleInviteMembers = () => {
    setIsInviteModalOpen(true);
  };

  const handleAddPayment = () => {
    setEditingPayment(null);
    setIsAddPaymentModalOpen(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setIsAddPaymentModalOpen(true);
  };

  const handleSettleDebt = (debt: DebtDetail) => {
    setSettlingDebt(debt);
    setIsSettleModalOpen(true);
  };

  const handleInviteUsers = async (userIds: string[]) => {
    if (!groupId) return;
    await createGroupInvitations(groupId, userIds, user?.id || '');
    await loadDetails();
  };

  const handleSavePayment = async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!groupId) return;
    if (editingPayment) {
      await updatePaymentInGroup(groupId, editingPayment.id, paymentData);
    } else {
      await addPaymentToGroup(groupId, paymentData);
    }
    await loadDetails();
  };

  const handleSettlement = async (settlement: Omit<Settlement, 'id' | 'createdAt'>) => {
    if (!groupId) return;
    await addSettlementToGroup(groupId, settlement);
    await loadDetails();
  };

  const handleArchive = async () => {
    if (!groupId) return;
    const confirmed = window.confirm('Archive this group? Payments and invitations will be disabled.');
    if (!confirmed) return;
    await archiveGroup(groupId);
    await loadDetails();
  };

  const handleLeaveGroup = async () => {
    if (!groupId || !user) return;
    const confirmed = window.confirm('Leave this group? Your share of split payments will be redistributed among the remaining members.');
    if (!confirmed) return;
    const success = await leaveGroup(groupId, user.id);
    if (success) navigate('/');
  };

  // Calculate optimized debts
  const optimizedDebts = optimizeDebts(groupDetails.members, groupDetails.currency);

  return (
    <div className="min-h-screen bg-gray-50">
      <GroupDetailsHeader
        group={groupDetails}
        currentUserId={user?.id || ''}
        onBack={() => navigate('/')}
        onInviteMembers={handleInviteMembers}
        onAddPayment={handleAddPayment}
        onArchive={handleArchive}
        onLeaveGroup={handleLeaveGroup}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Debt Summary */}
          <DebtSummary
            debts={optimizedDebts}
            currency={groupDetails.currency}
            currentUserId={user?.id || ''}
            onSettle={handleSettleDebt}
          />

          {/* Members List */}
          <MembersList members={groupDetails.members} currency={groupDetails.currency} />

          {/* Payment History */}
          <PaymentHistory
            payments={groupDetails.payments}
            onEditPayment={handleEditPayment}
            currentUserId={user?.id}
            members={groupDetails.members}
          />
        </div>
      </main>

      <InviteMembersModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        groupId={groupId || ''}
        groupName={groupDetails.name}
        currentMembers={groupDetails.members.map(m => m.id)}
        onInviteUsers={handleInviteUsers}
      />

      <AddPaymentModal
        isOpen={isAddPaymentModalOpen}
        onClose={() => {
          setIsAddPaymentModalOpen(false);
          setEditingPayment(null);
        }}
        groupId={groupId || ''}
        members={groupDetails.members}
        currency={groupDetails.currency}
        currentUserId={user?.id || ''}
        onAddPayment={handleSavePayment}
        editingPayment={editingPayment}
      />

      <SettleDebtModal
        isOpen={isSettleModalOpen}
        onClose={() => {
          setIsSettleModalOpen(false);
          setSettlingDebt(null);
        }}
        debt={settlingDebt}
        onSettle={handleSettlement}
      />
    </div>
  );
};
