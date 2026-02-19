import React, { useState } from 'react';
import { X, CheckCircle, Calendar, CreditCard } from 'lucide-react';
import { DebtDetail, Settlement } from '../types/group';

interface SettleDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: DebtDetail | null;
  onSettle: (settlement: Omit<Settlement, 'id' | 'createdAt'>) => void;
}

export const SettleDebtModal: React.FC<SettleDebtModalProps> = ({
  isOpen,
  onClose,
  debt,
  onSettle
}) => {
  const [formData, setFormData] = useState({
    amount: debt?.amount.toString() || '',
    date: new Date().toISOString().split('T')[0],
    method: 'cash' as const,
    status: 'confirmed' as const
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debt) return;

    setLoading(true);
    setError('');

    const amount = parseFloat(formData.amount);
    if (amount <= 0 || amount > debt.amount) {
      setError(`Amount must be between 0 and ${debt.currency}${debt.amount.toFixed(2)}`);
      setLoading(false);
      return;
    }

    try {
      const settlement: Omit<Settlement, 'id' | 'createdAt'> = {
        fromUserId: debt.fromUserId,
        fromUserName: debt.fromUserName,
        toUserId: debt.toUserId,
        toUserName: debt.toUserName,
        amount,
        currency: debt.currency,
        date: formData.date,
        status: formData.status,
        groupId: '' // Will be set by the parent component
      };

      await onSettle(settlement);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to settle debt');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen || !debt) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Settle Debt</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Debt Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Settling debt:</h3>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">{debt.fromUserName}</span>
              <span className="mx-2">owes</span>
              <span className="font-medium text-green-600">{debt.toUserName}</span>
            </p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {debt.currency}{debt.amount.toFixed(2)}
            </p>
          </div>

          {/* Settlement Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Settlement Amount *
            </label>
            <div className="relative">
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={debt.amount}
                required
                value={formData.amount}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder={`Max: ${debt.currency}${debt.amount.toFixed(2)}`}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Maximum: {debt.currency}{debt.amount.toFixed(2)}
            </p>
          </div>

          {/* Settlement Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Settlement Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="date"
                name="date"
                type="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                id="method"
                name="method"
                value={formData.method}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="revolut">Revolut</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending Confirmation</option>
            </select>
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
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Settle Debt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};