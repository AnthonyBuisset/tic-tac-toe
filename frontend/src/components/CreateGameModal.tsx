import React, { useState } from 'react';
import { FaPlus, FaTimes, FaSmile, FaStar, FaSpinner } from 'react-icons/fa';
import { UserBalance, TokenType } from '../wallet';

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: UserBalance;
  onCreateGame: () => Promise<void>;
  onCreateGameWithBet: (betAmount: number, tokenType: TokenType) => Promise<void>;
}

export function CreateGameModal({
  isOpen,
  onClose,
  balance,
  onCreateGame,
  onCreateGameWithBet
}: CreateGameModalProps) {
  const [gameType, setGameType] = useState<'regular' | 'betting'>('regular');
  const [betAmount, setBetAmount] = useState('');
  const [tokenType, setTokenType] = useState<'native' | 'token'>('native');
  const [selectedToken, setSelectedToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const formatBalance = (amount: number): string => {
    return (amount / 10000000).toFixed(7);
  };

  const getAvailableBalance = (): number => {
    if (tokenType === 'native') {
      return balance.native;
    } else {
      const token = balance.tokens?.find(t => t.symbol === selectedToken);
      return token ? token.balance : 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (gameType === 'regular') {
        await onCreateGame();
      } else {
        // Betting game
        const amountInStroops = Math.floor(parseFloat(betAmount) * 10000000);
        
        if (isNaN(amountInStroops) || amountInStroops <= 0) {
          throw new Error('Please enter a valid bet amount');
        }

        const availableBalance = getAvailableBalance();
        if (amountInStroops > availableBalance) {
          throw new Error('Insufficient balance for this bet');
        }

        if (tokenType === 'token' && !selectedToken) {
          throw new Error('Please select a token');
        }

        const tokenTypeParam: TokenType = {
          native: tokenType === 'native',
          symbol: tokenType === 'token' ? selectedToken : undefined
        };

        await onCreateGameWithBet(amountInStroops, tokenTypeParam);
      }

      // Reset form and close
      setBetAmount('');
      setSelectedToken('');
      setGameType('regular');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const handleMaxClick = () => {
    const maxAmount = getAvailableBalance();
    setBetAmount(formatBalance(maxAmount));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <FaPlus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Create New Game</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3 uppercase tracking-wide">Game Type</label>
            <div className="space-y-3">
              <label className="flex items-center p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-xl cursor-pointer hover:border-slate-500/70 transition-all duration-200 group">
                <input
                  type="radio"
                  value="regular"
                  checked={gameType === 'regular'}
                  onChange={(e) => setGameType(e.target.value as 'regular' | 'betting')}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-500 focus:ring-blue-500 focus:ring-2 mr-4"
                />
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <FaSmile className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">Regular Game</div>
                    <div className="text-sm text-slate-400">Play for fun, no betting involved</div>
                  </div>
                </div>
              </label>
              <label className="flex items-center p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-xl cursor-pointer hover:border-purple-500/70 transition-all duration-200 group">
                <input
                  type="radio"
                  value="betting"
                  checked={gameType === 'betting'}
                  onChange={(e) => setGameType(e.target.value as 'regular' | 'betting')}
                  className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-500 focus:ring-purple-500 focus:ring-2 mr-4"
                />
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                    <FaStar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">Betting Game</div>
                    <div className="text-sm text-slate-400">Winner takes all, draw returns bets</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Betting Options (only if betting game selected) */}
          {gameType === 'betting' && (
            <>
              {/* Token Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bet With</label>
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
                    <span className="text-sm text-gray-700">Token</span>
                  </label>
                </div>
              </div>

              {/* Token Selection (only for tokens) */}
              {tokenType === 'token' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Token</label>
                  {balance.tokens && balance.tokens.length > 0 ? (
                    <select
                      value={selectedToken}
                      onChange={(e) => setSelectedToken(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Choose a token...</option>
                      {balance.tokens.map((token, index) => (
                        <option key={index} value={token.symbol}>
                          {token.symbol} (Balance: {formatBalance(token.balance)})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-gray-500 py-2">
                      No tokens available. Deposit tokens first.
                    </div>
                  )}
                </div>
              )}

              {/* Bet Amount */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Bet Amount</label>
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Max: {formatBalance(getAvailableBalance())}
                  </button>
                </div>
                <input
                  type="number"
                  step="0.0000001"
                  min="0"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0.0000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {tokenType === 'native' ? 'XLM' : selectedToken || 'Token'} amount to bet
                </p>
              </div>

              {/* Available Balance Display */}
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Available balance:</span>
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatBalance(getAvailableBalance())} {tokenType === 'native' ? 'XLM' : selectedToken}
                </p>
              </div>

              {/* Betting Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-blue-800 text-xs">
                  <strong>How betting works:</strong>
                  <br />• Both players must bet the same amount
                  <br />• Winner takes all (2x bet amount)
                  <br />• In a draw, both players get their bet back
                  <br />• Funds are locked until the game ends
                </p>
              </div>
            </>
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
            disabled={loading || (gameType === 'betting' && getAvailableBalance() === 0)}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg ${
              loading || (gameType === 'betting' && getAvailableBalance() === 0)
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed border border-slate-600'
                : gameType === 'betting'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border border-purple-500 hover:border-purple-400 hover:shadow-purple-500/25'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border border-blue-500 hover:border-blue-400 hover:shadow-blue-500/25'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <FaSpinner className="animate-spin -ml-1 mr-3 h-6 w-6 text-slate-400" />
                Creating Game...
              </span>
            ) : gameType === 'betting' && getAvailableBalance() === 0 ? (
              'Insufficient Balance'
            ) : (
              <span className="flex items-center justify-center">
                {gameType === 'betting' ? (
                  <>
                    <FaStar className="w-5 h-5 mr-2" />
                    Create Betting Game
                  </>
                ) : (
                  <>
                    <FaPlus className="w-5 h-5 mr-2" />
                    Create Regular Game
                  </>
                )}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
