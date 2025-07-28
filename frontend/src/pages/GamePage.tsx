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
      <div className="game-board-container">
        <div className="error">Invalid game ID</div>
        <button className="back-button" onClick={handleBackToList}>
          ← Back to Games
        </button>
      </div>
    );
  }

  const gameIdNumber = parseInt(gameId, 10);
  if (isNaN(gameIdNumber)) {
    return (
      <div className="game-board-container">
        <div className="error">Invalid game ID: must be a number</div>
        <button className="back-button" onClick={handleBackToList}>
          ← Back to Games
        </button>
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
