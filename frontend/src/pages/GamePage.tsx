import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameBoard } from '../components/GameBoard';
import { WalletConnection, WalletService } from '../wallet';

interface GamePageProps {
  wallet: WalletConnection;
  walletService: WalletService;
}

export const GamePage: React.FC<GamePageProps> = ({ wallet, walletService }) => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const handleBackToList = () => {
    console.log('🔙 [Navigation] Returning to games list');
    navigate('/');
  };

  if (!gameId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 text-lg mb-4">Invalid game ID</div>
          <button 
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg transition-colors"
            onClick={handleBackToList}
          >
            ← Back to Games
          </button>
        </div>
      </div>
    );
  }

  const gameIdNumber = parseInt(gameId, 10);
  if (isNaN(gameIdNumber)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 text-lg mb-4">Invalid game ID: must be a number</div>
          <button 
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg transition-colors"
            onClick={handleBackToList}
          >
            ← Back to Games
          </button>
        </div>
      </div>
    );
  }

  console.log(`🎮 [Game Page] Loading game ${gameIdNumber}`);

  return (
    <GameBoard
      gameId={gameIdNumber}
      wallet={wallet}
      walletService={walletService}
      onBackToList={handleBackToList}
    />
  );
};
