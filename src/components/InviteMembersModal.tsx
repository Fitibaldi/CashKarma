import React, { useState, useEffect } from 'react';
import { X, UserPlus, Link, Copy, Check, Mail, Hash } from 'lucide-react';
import { User } from '../types/auth';
import { getAllUsers } from '../utils/auth';
import { generateInviteCode } from '../utils/groups';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  currentMembers: string[]; // Array of user IDs already in the group
  onInviteUsers: (userIds: string[]) => void;
}

export const InviteMembersModal: React.FC<InviteMembersModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  currentMembers,
  onInviteUsers
}) => {
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const init = async () => {
      const [allUsers, code] = await Promise.all([
        getAllUsers(),
        generateInviteCode(groupId),
      ]);
      setAvailableUsers(allUsers.filter(user => !currentMembers.includes(user.id)));
      setInviteCode(code);
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/invite/${groupId}?group=${encodeURIComponent(groupName)}`);
    };
    init();
  }, [isOpen, currentMembers, groupId, groupName]);

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleInviteSelected = async () => {
    if (selectedUsers.length === 0) return;
    
    setLoading(true);
    try {
      await onInviteUsers(selectedUsers);
      setSelectedUsers([]);
      onClose();
    } catch (error) {
      console.error('Failed to invite users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Invite Members</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Invite Code Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Hash className="w-5 h-5 mr-2" />
              Invite Code
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">
                Share this code with anyone — they can enter it directly in the app to join "{groupName}".
              </p>
              <div className="flex items-center space-x-2">
                <div className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-center text-2xl font-mono font-bold tracking-widest text-gray-900">
                  {inviteCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  {codeCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Invite Link Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Link className="w-5 h-5 mr-2" />
              Share Invite Link
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">
                Share this link with anyone you want to invite to "{groupName}". 
                They can register or login to join the group.
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Registered Users Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Invite Registered Users
            </h3>
            
            {availableUsers.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No other registered users available to invite</p>
              </div>
            ) : (
              <>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {availableUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserToggle(user.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="ml-3 flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {selectedUsers.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleInviteSelected}
              disabled={selectedUsers.length === 0 || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>
                    Invite {selectedUsers.length > 0 ? `(${selectedUsers.length})` : 'Selected'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};