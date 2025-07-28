import React from 'react';
import { WalletConnection } from '../wallet';

interface WalletConnectProps {
  onConnect: (wallet: WalletConnection) => void;
  connecting: boolean;
  error: string | null;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect, connecting, error }) => {
  return (
    <div className="wallet-connect">
      <h2>Connect Your Wallet</h2>
      <p>Connect your LOBSTR wallet to start playing Tic-Tac-Toe on Stellar Testnet</p>
      {error && <div className="error">{error}</div>}
      <button 
        className="connect-button" 
        onClick={() => onConnect({ publicKey: '', network: 'testnet' })}
        disabled={connecting}
      >
        {connecting ? 'Connecting...' : 'Connect LOBSTR Wallet'}
      </button>
      <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#999' }}>
        Make sure you have the LOBSTR wallet extension installed and set to Testnet
      </p>
    </div>
  );
};