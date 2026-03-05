import React, { useState, useRef, useEffect } from 'react';
import { Crown, Mail, Calendar, ChevronDown, ChevronUp, MoreVertical, UserMinus } from 'lucide-react';
import { GroupMember } from '../types/group';

interface MembersListProps {
  members: GroupMember[];
  currency: string;
  currentUserId?: string;
  groupCreatorId?: string;
  onRemoveMember?: (memberId: string) => void;
}

function MemberRow({
  member,
  currency,
  isCreator,
  canRemove,
  onRemove,
}: {
  member: GroupMember;
  currency: string;
  isCreator: boolean;
  canRemove: boolean;
  onRemove?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors gap-3">
      <div className="flex items-center space-x-4">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} className="w-full h-full rounded-full object-cover" />
            ) : (
              `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`
            )}
          </div>
          {member.role === 'admin' && (
            <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900">
            {member.firstName} {member.lastName}
            {member.role === 'admin' && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Admin</span>
            )}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-0.5">
            <div className="flex items-center space-x-1 min-w-0">
              <Mail className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[160px] sm:max-w-none">{member.email}</span>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <Calendar className="w-3 h-3" />
              <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="sm:text-right">
          <div className="grid grid-cols-3 gap-3 sm:gap-4 text-sm">
            <div>
              <p className="text-gray-500">Paid</p>
              <p className="font-semibold text-gray-900">{currency}{member.totalPaid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500">Owes</p>
              <p className="font-semibold text-gray-900">{currency}{member.totalOwed.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500">Balance</p>
              <p className={`font-semibold ${
                member.balance > 0 ? 'text-green-600' :
                member.balance < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {member.balance > 0 ? '+' : ''}{currency}{member.balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {canRemove && !isCreator && (
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Member actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => { setMenuOpen(false); onRemove?.(); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <UserMinus className="w-4 h-4" />
                  Remove member
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const MembersList: React.FC<MembersListProps> = ({
  members,
  currency,
  currentUserId,
  groupCreatorId,
  onRemoveMember,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const isCurrentUserCreator = currentUserId === groupCreatorId;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold text-gray-900">
          Group Members ({members.length})
        </h2>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="space-y-4 mt-4">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              currency={currency}
              isCreator={member.id === groupCreatorId}
              canRemove={isCurrentUserCreator && !!onRemoveMember}
              onRemove={() => onRemoveMember?.(member.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
