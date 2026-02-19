import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { joinGroupByCode } from '../utils/groups';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: () => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({ isOpen, onClose, onJoined }) => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !user) return null;

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 6) return;
    setStatus('loading');
    const success = await joinGroupByCode(trimmed, user.id);
    if (success) {
      setStatus('success');
      onJoined();
      setTimeout(() => {
        setStatus('idle');
        setCode('');
        onClose();
      }, 1500);
    } else {
      setStatus('error');
      setErrorMsg('Invalid code or group not found.');
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Join a Group</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {status === 'success' ? (
            <div className="text-center py-4">
              <div className="text-green-600 font-semibold text-lg">Joined successfully!</div>
              <p className="text-sm text-gray-500 mt-1">The group has been added to your dashboard.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">Enter the 6-character invite code shared with you.</p>
              <input
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setStatus('idle'); }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="e.g. X4K9PL"
                maxLength={6}
                autoFocus
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono font-bold tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              />
              {status === 'error' && (
                <p className="text-sm text-red-600">{errorMsg}</p>
              )}
            </>
          )}
        </div>

        {status !== 'success' && (
          <div className="flex items-center justify-end space-x-3 px-6 pb-6">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={code.trim().length < 6 || status === 'loading'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {status === 'loading' ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
