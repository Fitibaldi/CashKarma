import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BalanceSummary as BalanceSummaryType } from '../types/group';

interface BalanceSummaryProps {
  balances: BalanceSummaryType[];
  currency: string;
}

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({ balances, currency }) => {
  if (balances.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Balance Summary</h2>
        <div className="text-center py-8">
          <Minus className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-600 mb-2">All settled up!</h3>
          <p className="text-gray-500">Everyone has paid their share</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Balance Summary</h2>
      <div className="space-y-4">
        {balances.map((balance, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                {balance.fromUserName.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{balance.fromUserName}</p>
                <p className="text-sm text-gray-500">owes</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-center">
                <p className="text-lg font-bold text-red-600">
                  {currency}{balance.amount.toFixed(2)}
                </p>
                <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div>
                <p className="font-medium text-gray-900 text-right">{balance.toUserName}</p>
                <p className="text-sm text-gray-500 text-right">receives</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                {balance.toUserName.charAt(0)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};