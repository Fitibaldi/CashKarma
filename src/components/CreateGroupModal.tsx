import React, { useState, useEffect } from 'react';
import { X, MapPin, Users, FileText } from 'lucide-react';
import { searchEmoji, suggestEmoji } from '../utils/emojiSearch';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (groupData: GroupFormData) => Promise<void>;
}

export interface GroupFormData {
  name: string;
  description: string;
  location?: string;
  emoji?: string;
}

const FALLBACK_EMOJIS = ['👥', '🏠', '✈️', '🎉', '💼', '🍕', '🎮', '🏋️', '🌍', '💡'];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup
}) => {
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    location: '',
    emoji: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>(FALLBACK_EMOJIS.slice(0, 6));

  // Auto-suggest emojis as name changes
  useEffect(() => {
    const results = searchEmoji(formData.name, 6);
    if (results.length > 0) {
      setSuggestions(results);
      // Auto-select best match only if user hasn't manually picked one
      setFormData(prev => {
        const autoEmoji = suggestEmoji(prev.name) ?? '';
        // Only auto-update if still matches a previous auto value
        const wasAuto = !prev.emoji || FALLBACK_EMOJIS.includes(prev.emoji) || results.includes(prev.emoji) || prev.emoji === suggestEmoji(prev.name);
        return wasAuto ? { ...prev, emoji: autoEmoji } : prev;
      });
    } else {
      setSuggestions(FALLBACK_EMOJIS.slice(0, 6));
    }
  }, [formData.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name.trim()) {
      setError('Group name is required');
      setLoading(false);
      return;
    }

    try {
      await onCreateGroup(formData);
      setFormData({ name: '', description: '', location: '', emoji: '' });
      setSuggestions(FALLBACK_EMOJIS.slice(0, 6));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClose = () => {
    setFormData({ name: '', description: '', location: '', emoji: '' });
    setSuggestions(FALLBACK_EMOJIS.slice(0, 6));
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Group</h2>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Emoji icon preview + picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Icon</label>
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl flex-shrink-0 select-none">
                {formData.emoji ? formData.emoji : (
                  <span className="text-white text-2xl font-bold">
                    {formData.name.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>
              {/* Suggestions */}
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-2">
                  {searchEmoji(formData.name, 1).length > 0 ? 'Suggested — tap to select:' : 'Choose an emoji:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, emoji: prev.emoji === emoji ? '' : emoji }))}
                      className={`w-9 h-9 text-xl rounded-lg border-2 flex items-center justify-center transition-all ${
                        formData.emoji === emoji
                          ? 'border-blue-500 bg-blue-50 scale-110'
                          : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                  {formData.emoji && !suggestions.includes(formData.emoji) && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, emoji: '' }))}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Group Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter group name"
                maxLength={50}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                placeholder="What's this group for?"
                maxLength={200}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">{formData.description.length}/200 characters</p>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location (optional)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Where is this group based?"
                maxLength={100}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  <span>Create Group</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
