import React from 'react';
import { CreditCard, Clock, CheckCircle, Banknote, Building, Smartphone, DollarSign, Edit } from 'lucide-react';
import { Payment } from '../types/group';

interface PaymentHistoryProps {
  payments: Payment[];
  onEditPayment?: (payment: Payment) => void;
  currentUserId?: string;
}

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case 'cash':
      return <Banknote className="w-4 h-4" />;
    case 'bank':
      return <Building className="w-4 h-4" />;
    case 'revolut':
      return <Smartphone className="w-4 h-4" />;
    case 'paypal':
      return <DollarSign className="w-4 h-4" />;
    default:
      return <CreditCard className="w-4 h-4" />;
  }
};

const getPaymentMethodColor = (method: string) => {
  switch (method) {
    case 'cash':
      return 'bg-green-100 text-green-800';
    case 'bank':
      return 'bg-blue-100 text-blue-800';
    case 'revolut':
      return 'bg-purple-100 text-purple-800';
    case 'paypal':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ 
  payments, 
  onEditPayment,
  currentUserId 
}) => {
  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
          <p className="text-gray-500">Payment history will appear here once members start settling up</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Payment History ({payments.length})
      </h2>
      <div className="space-y-4">
        {payments.map((payment) => (
          <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {payment.fromUserName.split(' ').map(n => n.charAt(0)).join('')}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  <span className="text-blue-600">{payment.fromUserName}</span>
                  <span className="text-gray-500 mx-2">paid for</span>
                  <span className="text-green-600">
                    {payment.splitType === 'equal' 
                      ? 'everyone' 
                      : `${payment.selectedMembers.length} member${payment.selectedMembers.length > 1 ? 's' : ''}`
                    }
                  </span>
                </p>
                <p className="text-sm text-gray-500">{payment.description}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getPaymentMethodColor(payment.method)}`}>
                    {getPaymentMethodIcon(payment.method)}
                    <span className="capitalize">{payment.method}</span>
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {payment.currency}{payment.amount.toFixed(2)}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {payment.status === 'confirmed' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Confirmed</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600">Pending</span>
                    </>
                  )}
                </div>
              </div>
              
              {onEditPayment && currentUserId && (currentUserId === payment.fromUserId || currentUserId === payment.toUserId) && (
                <button
                  onClick={() => onEditPayment(payment)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit payment"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};