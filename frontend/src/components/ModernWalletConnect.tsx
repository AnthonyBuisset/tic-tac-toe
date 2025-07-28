import React from 'react';
import { FaGamepad, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

interface ModernWalletConnectProps {
  onConnect: () => void;
  connecting: boolean;
  error: string | null;
}

export const ModernWalletConnect: React.FC<ModernWalletConnectProps> = ({ onConnect, connecting, error }) => {
  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <FaGamepad className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
        <p className="text-slate-400">
          Connect your LOBSTR wallet to start playing on the Stellar blockchain
        </p>
      </div>
      
      {/* Error */}
      {error && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        </div>
      )}
      
      {/* Connect Button */}
      <button 
        onClick={onConnect}
        disabled={connecting}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
      >
        <span className="flex items-center justify-center">
          {connecting && (
            <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
          )}
          {connecting ? 'Connecting...' : 'Connect LOBSTR Wallet'}
        </span>
      </button>
      
      {/* Help Text */}
      <p className="text-slate-500 text-sm text-center">
        Make sure you have the LOBSTR wallet extension installed and set to Testnet
      </p>
    </div>
  );
};
