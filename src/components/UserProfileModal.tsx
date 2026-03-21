import React, { useState, useRef } from 'react';
import { X, Camera, Search, Pencil } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CURRENCIES, DEFAULT_CURRENCY } from '../utils/currencies';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(user?.avatarUrl);
  const [currency, setCurrency] = useState(user?.currency ?? DEFAULT_CURRENCY);
  const [currencySearch, setCurrencySearch] = useState('');
  const [editingCurrency, setEditingCurrency] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen || !user) return null;

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSave = () => {
    setSaving(true);
    updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), avatarUrl: previewUrl, currency });
    setSaving(false);
    onClose();
  };

  const filteredCurrencies = currencySearch.trim()
    ? CURRENCIES.filter(c =>
        c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
        c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
        c.symbol.toLowerCase().includes(currencySearch.toLowerCase())
      )
    : CURRENCIES;

  const selectedCurrency = CURRENCIES.find(c => c.symbol === currency);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Your Profile</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-2xl font-bold">{initials}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Change photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Default Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
            <p className="text-xs text-gray-500 mb-2">Used as the default when creating new groups.</p>

            {/* Selected currency pill */}
            <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-lg font-semibold text-blue-700">{selectedCurrency?.symbol ?? currency}</span>
              <span className="text-sm font-medium text-blue-700">{selectedCurrency?.code ?? ''}</span>
              <span className="text-sm text-blue-500">{selectedCurrency?.name ?? ''}</span>
              <button
                type="button"
                onClick={() => setEditingCurrency(v => !v)}
                className="ml-auto p-1 text-blue-400 hover:text-blue-600 transition-colors rounded"
                aria-label="Edit currency"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>

            {editingCurrency && (
              <>
                {/* Search */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={currencySearch}
                    onChange={e => setCurrencySearch(e.target.value)}
                    placeholder="Search by code, name or symbol…"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                {/* Currency list */}
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {filteredCurrencies.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => { setCurrency(c.symbol); setEditingCurrency(false); setCurrencySearch(''); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                        currency === c.symbol
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="w-6 text-center font-semibold text-base">{c.symbol}</span>
                      <span className="font-medium w-10 flex-shrink-0">{c.code}</span>
                      <span className="text-gray-500 truncate">{c.name}</span>
                    </button>
                  ))}
                  {filteredCurrencies.length === 0 && (
                    <p className="px-3 py-3 text-sm text-gray-400 text-center">No currencies found.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6 pt-2 border-t border-gray-100">
          <button
            onClick={logout}
            className="px-4 py-2 text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Logout
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !firstName.trim() || !lastName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
