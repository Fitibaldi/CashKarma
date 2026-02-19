import React from 'react';
import { Users, Plus } from 'lucide-react';

interface EmptyStateProps {
  onCreateGroup: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreateGroup }) => {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Users className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups yet</h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        Create your first group to start sharing expenses with friends, family, or roommates.
      </p>
      <button
        onClick={onCreateGroup}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span>Create Your First Group</span>
      </button>
    </div>
  );
};