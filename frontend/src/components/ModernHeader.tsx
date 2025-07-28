import React from 'react';
import { FaGamepad, FaPlus, FaSync } from 'react-icons/fa';
import { BalancePopover } from './BalancePopover';
import { UserBalance } from '../wallet';

interface ModernHeaderProps {
  balance: UserBalance;
  balanceLoading: boolean;
  onManageBalance: () => void;
  onCreateGame: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
  balance,
  balanceLoading,
  onManageBalance,
  onCreateGame,
  onRefresh,
  loading,
}) => {
  return (
    <header className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FaGamepad className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TicTac Arena</h1>
              <p className="text-slate-400 text-sm">Stellar Gaming</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onCreateGame}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <span className="flex items-center">
                <FaPlus className="w-4 h-4 mr-2" />
                New Game
              </span>
            </button>
            
            <button
              onClick={onRefresh}
              disabled={loading}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <BalancePopover
              balance={balance}
              loading={balanceLoading}
              onManageBalance={onManageBalance}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
