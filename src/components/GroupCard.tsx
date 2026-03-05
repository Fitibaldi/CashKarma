import React, { useState, useRef, useEffect } from 'react';
import { Users, DollarSign, Calendar, ChevronRight, Archive, Crown, Trash2, UserPlus, Plus, LogOut } from 'lucide-react';

interface GroupCardProps {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  totalExpenses: number;
  currency: string;
  lastActivity: string;
  avatarUrl?: string;
  yourBalance: number;
  isArchived?: boolean;
  isOwner?: boolean;
  onClick: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onInvite?: (id: string) => void;
  onAddPayment?: (id: string) => void;
  onLeaveGroup?: (id: string) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  id,
  name,
  description,
  memberCount,
  totalExpenses,
  currency,
  lastActivity,
  avatarUrl,
  yourBalance,
  isArchived,
  isOwner,
  onClick,
  onArchive,
  onDelete,
  onInvite,
  onAddPayment,
  onLeaveGroup,
}) => {
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

  const balanceColor = yourBalance > 0
    ? 'text-green-600'
    : yourBalance < 0
    ? 'text-red-600'
    : 'text-gray-600';

  const balanceText = yourBalance > 0
    ? `You are owed ${currency}${Math.abs(yourBalance).toFixed(2)}`
    : yourBalance < 0
    ? `You owe ${currency}${Math.abs(yourBalance).toFixed(2)}`
    : 'You are settled up';

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(prev => !prev);
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    setMenuOpen(false);
    action();
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-200 cursor-pointer group ${isArchived ? 'border-amber-200 opacity-75' : 'border-gray-100'}`}
      onClick={() => onClick(id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 ${isArchived ? 'bg-gray-400' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
            {avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('blob:')) ? (
              <img src={avatarUrl} alt={name} className="w-full h-full rounded-lg object-cover" />
            ) : avatarUrl && (avatarUrl.codePointAt(0) ?? 0) > 0xFF ? (
              <span className="text-2xl leading-none">{avatarUrl}</span>
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                {name}
              </h3>
              {isOwner && (
                <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
              )}
              {isArchived && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  <Archive className="w-3 h-3" />
                  Archived
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">{description}</p>
          </div>
        </div>

        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={handleMenuClick}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Group actions"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {isArchived ? (
                onDelete && (
                  <button
                    onClick={(e) => handleAction(e, () => onDelete(id))}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete group
                  </button>
                )
              ) : (
                <>
                  {onAddPayment && (
                    <button
                      onClick={(e) => handleAction(e, () => onAddPayment(id))}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add payment
                    </button>
                  )}
                  {isOwner && onInvite && (
                    <button
                      onClick={(e) => handleAction(e, () => onInvite(id))}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite members
                    </button>
                  )}
                  {isOwner && onArchive && (
                    <button
                      onClick={(e) => handleAction(e, () => onArchive(id))}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                      Archive group
                    </button>
                  )}
                  {!isOwner && onLeaveGroup && (
                    <button
                      onClick={(e) => handleAction(e, () => onLeaveGroup(id))}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Leave group
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{memberCount} members</span>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{currency}{totalExpenses.toFixed(2)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{lastActivity}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <p className={`text-sm font-medium ${balanceColor}`}>
          {balanceText}
        </p>
      </div>
    </div>
  );
};
