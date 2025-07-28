import React, { useState } from 'react';
import { FaCheckCircle, FaTimes, FaPlusCircle, FaMinusCircle, FaSpinner } from 'react-icons/fa';
import { UserBalance } from '../wallet';

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: UserBalance;
  onDeposit: (isNative: boolean, tokenAddress: string, amount: number) => Promise<void>;
  onWithdraw: (isNative: boolean, tokenAddress: string, amount: number) => Promise<void>;
  onRefreshBalance: () => void;
}

export function DepositWithdrawModal({
  isOpen,
  onClose,
  balance,
  onDeposit,
  onWithdraw,
  onRefreshBalance
}: DepositWithdrawModalProps) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [tokenType, setTokenType] = useState<'native' | 'token'>('native');
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const amountInStroops = Math.floor(parseFloat(amount) * 10000000); // Convert XLM to stroops
      
      if (isNaN(amountInStroops) || amountInStroops <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (tokenType === 'token' && !tokenAddress.trim()) {
        throw new Error('Please enter a token address');
      }

      const isNative = tokenType === 'native';
      const tokenAddr = isNative ? '' : tokenAddress.trim();

      if (activeTab === 'deposit') {
        await onDeposit(isNative, tokenAddr, amountInStroops);
      } else {
        await onWithdraw(isNative, tokenAddr, amountInStroops);
      }

      // Reset form
      setAmount('');
      setTokenAddress('');
      
      // Refresh balance
      await onRefreshBalance();
      
      // Show success and close
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (amount: number): string => {
    return (amount / 10000000).toFixed(7);
  };

  const getMaxWithdrawAmount = (): number => {
    if (tokenType === 'native') {
      return balance.native;
    } else {
      const token = balance.tokens?.find(t => t.symbol === tokenAddress);
      return token ? token.balance : 0;
    }
  };

  const handleMaxClick = () => {
    const maxAmount = getMaxWithdrawAmount();
    setAmount(formatBalance(maxAmount));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
              <FaCheckCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Manage Balance</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex mb-6 bg-slate-800 rounded-xl p-1 border border-slate-600">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'deposit'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg border border-emerald-500'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'withdraw'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg border border-red-500'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            Withdraw
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Token Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Token Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="native"
                  checked={tokenType === 'native'}
                  onChange={(e) => setTokenType(e.target.value as 'native' | 'token')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Native XLM</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="token"
                  checked={tokenType === 'token'}
                  onChange={(e) => setTokenType(e.target.value as 'native' | 'token')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Stellar Token</span>
              </label>
            </div>
          </div>

          {/* Token Address Input (only for tokens) */}
          {tokenType === 'token' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Token Address/Symbol
              </label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="e.g., USDC, USDT, or contract address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              {activeTab === 'withdraw' && (
                <button
                  type="button"
                  onClick={handleMaxClick}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Max: {formatBalance(getMaxWithdrawAmount())}
                </button>
              )}
            </div>
            <input
              type="number"
              step="0.0000001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {tokenType === 'native' ? 'XLM' : tokenAddress || 'Token'} amount
            </p>
          </div>

          {/* Current Balance Display */}
          {activeTab === 'withdraw' && (
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Available to withdraw:</span>
              </p>
              {tokenType === 'native' ? (
                <p className="text-lg font-semibold text-gray-900">
                  {formatBalance(balance.native)} XLM
                </p>
              ) : (
                <p className="text-lg font-semibold text-gray-900">
                  {(() => {
                    const token = balance.tokens?.find(t => t.symbol === tokenAddress);
                    return token ? `${formatBalance(token.balance)} ${token.symbol}` : '0.0000000';
                  })()}
                </p>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg ${
              loading
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed border border-slate-600'
                : activeTab === 'deposit'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white border border-emerald-500 hover:border-emerald-400 hover:shadow-emerald-500/25'
                : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border border-red-500 hover:border-red-400 hover:shadow-red-500/25'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <FaSpinner className="animate-spin -ml-1 mr-3 h-6 w-6 text-slate-400" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                {activeTab === 'deposit' ? (
                  <>
                    <FaPlusCircle className="w-5 h-5 mr-2" />
                    Deposit {tokenType === 'native' ? 'XLM' : 'Token'}
                  </>
                ) : (
                  <>
                    <FaMinusCircle className="w-5 h-5 mr-2" />
                    Withdraw {tokenType === 'native' ? 'XLM' : 'Token'}
                  </>
                )}
              </span>
            )}
          </button>
        </form>

        {/* Info Note */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-blue-800 text-xs">
            <strong>Note:</strong> {activeTab === 'deposit' 
              ? 'Depositing funds locks them in the contract for betting. You can withdraw unused funds at any time.'
              : 'Only unused funds can be withdrawn. Funds locked in active bets cannot be withdrawn until the game ends.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
