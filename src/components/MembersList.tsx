import React from 'react';
import { Crown, User, Mail, Calendar } from 'lucide-react';
import { GroupMember } from '../types/group';

interface MembersListProps {
  members: GroupMember[];
  currency: string;
}

export const MembersList: React.FC<MembersListProps> = ({ members, currency }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Group Members ({members.length})
      </h2>
      <div className="space-y-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="relative">
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
              <div>
                <h3 className="font-semibold text-gray-900">
                  {member.firstName} {member.lastName}
                  {member.role === 'admin' && (
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Admin</span>
                  )}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="grid grid-cols-3 gap-4 text-sm">
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
          </div>
        ))}
      </div>
    </div>
  );
};