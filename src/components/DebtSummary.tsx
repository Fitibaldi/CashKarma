import React, { useState } from 'react';
import { TrendingUp, TrendingDown, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { DebtDetail } from '../types/group';

interface DebtSummaryProps {
  debts: DebtDetail[];
  currency: string;
  currentUserId: string;
  onSettle: (debt: DebtDetail) => void;
}

export const DebtSummary: React.FC<DebtSummaryProps> = ({
  debts,
  currency,
  currentUserId,
  onSettle
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const userDebts = debts.filter(debt => debt.fromUserId === currentUserId);
  const userCredits = debts.filter(debt => debt.toUserId === currentUserId);

  if (debts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <button
          onClick={() => setIsOpen(o => !o)}
          className="w-full flex items-center justify-between text-left"
        >
          <h2 className="text-lg font-semibold text-gray-900">Debt Summary</h2>
          {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        {isOpen && (
          <div className="text-center py-8 mt-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-600 mb-2">All settled up!</h3>
            <p className="text-gray-500">Everyone has paid their share</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold text-gray-900">Debt Summary</h2>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {isOpen && <div className="space-y-6 mt-6">
        {/* What you owe */}
        {userDebts.length > 0 && (
          <div>
            <h3 className="text-md font-medium text-red-700 mb-3 flex items-center">
              <TrendingDown className="w-4 h-4 mr-2" />
              You owe
            </h3>
            <div className="space-y-3">
              {userDebts.map((debt, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {debt.toUserName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{debt.toUserName}</p>
                      <p className="text-sm text-gray-600">You owe</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-lg font-bold text-red-600">
                      {currency}{debt.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What you're owed */}
        {userCredits.length > 0 && (
          <div>
            <h3 className="text-md font-medium text-green-700 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              You are owed
            </h3>
            <div className="space-y-3">
              {userCredits.map((debt, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {debt.fromUserName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{debt.fromUserName}</p>
                      <p className="text-sm text-gray-600">owes you</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {currency}{debt.amount.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => onSettle(debt)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 flex-shrink-0"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Settle</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All other debts in the group */}
        {debts.filter(debt => debt.fromUserId !== currentUserId && debt.toUserId !== currentUserId).length > 0 && (
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Other group debts</h3>
            <div className="space-y-3">
              {debts
                .filter(debt => debt.fromUserId !== currentUserId && debt.toUserId !== currentUserId)
                .map((debt, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {debt.fromUserName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 flex flex-wrap gap-x-1">
                          <span className="text-blue-600">{debt.fromUserName}</span>
                          <span className="text-gray-500">owes</span>
                          <span className="text-green-600">{debt.toUserName}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-semibold text-gray-700">
                        {currency}{debt.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>}
    </div>
  );
};