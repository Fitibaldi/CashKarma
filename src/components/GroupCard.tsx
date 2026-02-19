import React from 'react';
import { Users, DollarSign, Calendar, ChevronRight } from 'lucide-react';

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
  onClick: (id: string) => void;
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
  onClick
}) => {
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

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => onClick(id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full rounded-lg object-cover" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
              {name}
            </h3>
            <p className="text-gray-500 text-sm">{description}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
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