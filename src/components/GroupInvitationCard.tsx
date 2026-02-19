import React from 'react';
import { Users, Clock, Check, X, Calendar } from 'lucide-react';
import { GroupInvitation } from '../types/group';

interface GroupInvitationCardProps {
  invitation: GroupInvitation;
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
}

export const GroupInvitationCard: React.FC<GroupInvitationCardProps> = ({
  invitation,
  onAccept,
  onDecline
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
            {invitation.groupName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {invitation.groupName}
            </h3>
            <p className="text-gray-500 text-sm">{invitation.groupDescription}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Pending</span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-blue-600">{invitation.invitedByName}</span>
          <span> invited you to join this group</span>
        </p>
        <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>Invited {new Date(invitation.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => onAccept(invitation.id)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <Check className="w-4 h-4" />
          <span>Accept</span>
        </button>
        <button
          onClick={() => onDecline(invitation.id)}
          className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
        >
          <X className="w-4 h-4" />
          <span>Decline</span>
        </button>
      </div>
    </div>
  );
};