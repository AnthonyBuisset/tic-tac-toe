import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ModernWalletConnect } from './components/ModernWalletConnect';
import { ModernGamesListPage } from './pages/ModernGamesListPage';
import { GamePage } from './pages/GamePage';
import { WalletConnection, WalletService } from './wallet';

const AppContent: React.FC = () => {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [walletService] = useState(() => new WalletService());
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    console.log('🔗 [Wallet] Attempting to connect...');
    setConnecting(true);
    setError(null);
    try {
      const connection = await walletService.connectLobstrWallet();
      if (connection) {
        console.log('✅ [Wallet] Connected successfully:', connection);
        setWallet(connection);
      }
    } catch (err: unknown) {
      console.error('❌ [Wallet] Connection failed:', err);
      setError((err as Error).message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  if (!wallet) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">TicTac Arena</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Connect your wallet to start playing</p>
          <ModernWalletConnect 
            onConnect={handleConnect}
            connecting={connecting}
            error={error}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        <Route 
          path="/" 
          element={<ModernGamesListPage wallet={wallet} walletService={walletService} />} 
        />
        <Route 
          path="/games/:gameId" 
          element={<GamePage wallet={wallet} walletService={walletService} />} 
        />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;