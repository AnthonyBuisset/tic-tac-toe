import React, { useState, useRef, useEffect } from 'react';
import { FaCheckCircle, FaChevronDown } from 'react-icons/fa';
import { UserBalance } from '../wallet';

interface BalancePopoverProps {
  balance: UserBalance;
  loading: boolean;
  onManageBalance: () => void;
}

export const BalancePopover: React.FC<BalancePopoverProps> = ({ 
  balance, 
  loading, 
  onManageBalance 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatBalance = (amount: number) => {
    if (amount === 0) return '0';
    if (amount < 0.01) return '<0.01';
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    });
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg px-3 py-2 transition-colors"
      >
        <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
          <FaCheckCircle className="w-4 h-4 text-white" />
        </div>
        <div className="text-left">
          <div className="text-gray-900 dark:text-white text-sm font-medium">Balance</div>
          <div className="text-gray-600 dark:text-gray-400 text-xs">
            {loading ? 'Loading...' : `${formatBalance(balance.native)} XLM`}
          </div>
        </div>
        <FaChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50"
        >
          <div className="p-4">
            <h3 className="text-white font-semibold mb-4">Account Balance</h3>

            {/* Native Balance */}
            <div className="bg-slate-900 rounded-lg p-3 mb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">XLM</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">Stellar Lumens</div>
                    <div className="text-slate-400 text-sm">Native Token</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {loading ? 'Loading...' : formatBalance(balance.native)}
                  </div>
                  <div className="text-slate-400 text-sm">XLM</div>
                </div>
              </div>
            </div>

            {/* Other Tokens */}
            {balance.tokens.length > 0 && (
              <div className="space-y-2">
                <div className="text-slate-400 text-sm">Other Tokens</div>
                {balance.tokens.map((token, index) => (
                  <div key={index} className="bg-slate-900 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center">
                          <span className="text-white font-bold text-xs">{token.symbol.slice(0, 2)}</span>
                        </div>
                        <span className="text-white text-sm">{token.symbol}</span>
                      </div>
                      <span className="text-white font-medium">{formatBalance(token.balance)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                onManageBalance();
                setIsOpen(false);
              }}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Manage Balance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
