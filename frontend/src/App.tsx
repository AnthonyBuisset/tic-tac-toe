import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletConnect } from './components/WalletConnect';
import { GamesListPage } from './pages/GamesListPage';
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
      <div className="App">
        <h1>🎮 Tic-Tac-Toe</h1>
        <p>Play Tic-Tac-Toe on the Stellar blockchain</p>
        <WalletConnect 
          onConnect={handleConnect}
          connecting={connecting}
          error={error}
        />
      </div>
    );
  }

  return (
    <div className="App">
      <h1>🎮 Tic-Tac-Toe</h1>
      <p>Play Tic-Tac-Toe on the Stellar blockchain</p>
      
      <Routes>
        <Route 
          path="/" 
          element={<GamesListPage wallet={wallet} walletService={walletService} />} 
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