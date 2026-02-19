import React from 'react';
import { ArrowLeft, MapPin, Calendar, Users, Settings, UserPlus, Plus } from 'lucide-react';
import { GroupDetails } from '../types/group';

interface GroupDetailsHeaderProps {
  group: GroupDetails;
  onBack: () => void;
  onInviteMembers: () => void;
  onAddPayment: () => void;
}

export const GroupDetailsHeader: React.FC<GroupDetailsHeaderProps> = ({ 
  group, 
  onBack, 
  onInviteMembers,
  onAddPayment
}) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-xl">
              {group.avatarUrl ? (
                <img src={group.avatarUrl} alt={group.name} className="w-full h-full rounded-xl object-cover" />
              ) : (
                group.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
              <p className="text-gray-600 mt-1">{group.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onAddPayment}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Payment</span>
              </button>
              <button
                onClick={onInviteMembers}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite</span>
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>{group.members.length} members</span>
            </div>
            {group.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{group.location}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};