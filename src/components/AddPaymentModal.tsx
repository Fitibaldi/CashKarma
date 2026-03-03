import React, { useState } from 'react';
import { X, DollarSign, Calendar, CreditCard, User, FileText, Users } from 'lucide-react';
import { GroupMember, Payment } from '../types/group';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: GroupMember[];
  currency: string;
  currentUserId: string;
  onAddPayment: (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingPayment?: Payment | null;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  isOpen,
  onClose,
  groupId,
  members,
  currency,
  currentUserId,
  onAddPayment,
  editingPayment
}) => {
  const [formData, setFormData] = useState({
    fromUserId: editingPayment?.fromUserId || currentUserId,
    splitType: editingPayment?.splitType || 'equal' as 'equal' | 'specific',
    selectedMembers: editingPayment?.selectedMembers || members.map(m => m.id),
    amount: editingPayment?.amount?.toString() || '',
    description: editingPayment?.description || '',
    date: editingPayment?.date || new Date().toISOString().split('T')[0],
    method: editingPayment?.method || 'cash' as const,
    status: editingPayment?.status || 'confirmed' as const
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.splitType === 'specific' && formData.selectedMembers.length === 0) {
      setError('Please select at least one member to split with');
      setLoading(false);
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    if (formData.splitType === 'specific' && formData.selectedMembers.includes(formData.fromUserId) && formData.selectedMembers.length === 1) {
      setError('Cannot split payment only with yourself');
      setLoading(false);
      return;
    }

    try {
      const fromUser = members.find(m => m.id === formData.fromUserId);

      const paymentData = {
        fromUserId: formData.fromUserId,
        fromUserName: `${fromUser?.firstName} ${fromUser?.lastName}`,
        splitType: formData.splitType,
        selectedMembers: formData.selectedMembers,
        splitBetween: formData.selectedMembers,
        paidBy: formData.fromUserId,
        amount: parseFloat(formData.amount),
        currency,
        description: formData.description.trim(),
        date: formData.date,
        method: formData.method,
        status: formData.status,
        groupId
      };

      await onAddPayment(paymentData);
      
      // Reset form
      setFormData({
        fromUserId: currentUserId,
        splitType: 'equal',
        selectedMembers: members.map(m => m.id),
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        method: 'cash',
        status: 'confirmed'
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSplitTypeChange = (splitType: 'equal' | 'specific') => {
    setFormData(prev => ({
      ...prev,
      splitType,
      selectedMembers: splitType === 'equal' ? members.map(m => m.id) : []
    }));
  };

  const handleMemberToggle = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(memberId)
        ? prev.selectedMembers.filter(id => id !== memberId)
        : [...prev.selectedMembers, memberId]
    }));
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingPayment ? 'Edit Payment' : 'Add Payment'}
          </h2>
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

          {/* Who Paid */}
          <div>
            <label htmlFor="fromUserId" className="block text-sm font-medium text-gray-700 mb-2">
              Who Paid *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                id="fromUserId"
                name="fromUserId"
                required
                value={formData.fromUserId}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.amount}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder={`Enter amount in ${currency}`}
              />
            </div>
          </div>

          {/* Split Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Split Payment *
            </label>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="splitType"
                  checked={formData.splitType === 'equal'}
                  onChange={() => handleSplitTypeChange('equal')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">Split equally among all members</span>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="splitType"
                  checked={formData.splitType === 'specific'}
                  onChange={() => handleSplitTypeChange('specific')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">Split with specific members</span>
                </div>
              </label>
            </div>

            {formData.splitType === 'specific' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-3">Select members to split with:</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {members.map((member) => (
                    <label key={member.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.selectedMembers.includes(member.id)}
                        onChange={() => handleMemberToggle(member.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                          {member.firstName.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-900">
                          {member.firstName} {member.lastName}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
                {formData.selectedMembers.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Split among {formData.selectedMembers.length} member{formData.selectedMembers.length > 1 ? 's' : ''} 
                    ({currency}{(parseFloat(formData.amount || '0') / formData.selectedMembers.length).toFixed(2)} each)
                  </p>
                )}
              </div>
            )}

            {formData.splitType === 'equal' && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Split equally among all {members.length} members 
                  ({currency}{(parseFloat(formData.amount || '0') / members.length).toFixed(2)} each)
                </p>
              </div>
            )}
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
                placeholder="What was this payment for?"
                maxLength={200}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length}/200 characters
            </p>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date *
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
            <div className="relative">
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
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
                  <DollarSign className="w-5 h-5" />
                  <span>{editingPayment ? 'Update Payment' : 'Add Payment'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};