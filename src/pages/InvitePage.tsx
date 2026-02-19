import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Users, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getGroupByInviteId, joinGroupByInvite, getUserInvitations } from '../utils/groups';
import { Group } from '../data/mockData';

export const InvitePage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  const groupName = searchParams.get('group') || 'Unknown Group';

  useEffect(() => {
    if (!groupId) { setLoading(false); return; }
    const init = async () => {
      const foundGroup = await getGroupByInviteId(groupId);
      setGroup(foundGroup);

      if (user) {
        const userInvitations = await getUserInvitations(user.id);
        const alreadyJoined = userInvitations.find(inv => inv.groupId === groupId && inv.status === 'accepted');
        if (alreadyJoined) setJoined(true);
      }
      setLoading(false);
    };
    init();
  }, [groupId, user]);

  const handleJoinGroup = async () => {
    if (!user || !groupId) return;

    setJoining(true);
    setError('');

    try {
      const success = await joinGroupByInvite(groupId, user.id);
      if (success) {
        setJoined(true);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError('Failed to join the group. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while joining the group.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">
            This invitation link is invalid or the group no longer exists.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You've Joined!</h1>
          <p className="text-gray-600 mb-6">
            You've successfully joined "{group?.name}". Redirecting to your dashboard...
          </p>
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Invited!</h1>
            <p className="text-gray-600">
              You've been invited to join "{groupName}"
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Group Details:</h3>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Name:</strong> {group.name}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Description:</strong> {group.description}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Members:</strong> {group.memberCount} people
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              To join this group, please login or create an account
            </p>
            <button
              onClick={() => {
                sessionStorage.setItem('inviteRedirect', `/invite/${groupId}?group=${encodeURIComponent(groupName)}`);
                navigate('/');
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Login / Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {group.avatarUrl ? (
              <img src={group.avatarUrl} alt={group.name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <Users className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Group</h1>
          <p className="text-gray-600">
            You've been invited to join "{group.name}". Click below to join instantly.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Group Details:</h3>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Name:</strong> {group.name}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Description:</strong> {group.description}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Members:</strong> {group.memberCount} people
          </p>
          {group.location && (
            <p className="text-sm text-gray-600">
              <strong>Location:</strong> {group.location}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm text-gray-600 text-center">
            Logged in as: <strong>{user.firstName} {user.lastName}</strong>
          </p>
          <button
            onClick={handleJoinGroup}
            disabled={joining}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            {joining ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Users className="w-5 h-5" />
                <span>Join Group</span>
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};