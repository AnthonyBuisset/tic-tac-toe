import React, { useState, useEffect, useCallback } from 'react';
import { WalletConnection, WalletService } from '../wallet';

interface GameData {
  id: number;
  board: Array<'X' | 'O' | null>;
  current_player: 'X' | 'O';
  player_x: string;
  player_o: string;
  status: 'InProgress' | 'XWins' | 'OWins' | 'Draw';
}

interface GameBoardProps {
  gameId: number;
  wallet: WalletConnection;
  walletService: WalletService;
  onBackToList: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameId,
  wallet,
  walletService,
  onBackToList
}) => {
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [makingMove, setMakingMove] = useState<number | null>(null);

  const loadGame = useCallback(async () => {
    try {
      setError(null);
      const gameData = await walletService.getGame(wallet, gameId);
      setGame(gameData);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load game');
    } finally {
      setLoading(false);
    }
  }, [gameId, walletService, wallet]);

  const makeMove = async (position: number) => {
    if (!game || makingMove !== null) return;
    
    setMakingMove(position);
    setError(null);
    try {
      await walletService.makeMove(wallet, gameId, position);
      await loadGame(); // Reload game state
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to make move');
    } finally {
      setMakingMove(null);
    }
  };

  useEffect(() => {
    loadGame();
    
    // Auto-refresh game state every 5 seconds
    const interval = setInterval(loadGame, 5000);
    return () => clearInterval(interval);
  }, [loadGame]);

  const formatAddress = (address: string) => {
    if (address === 'waiting') return 'Waiting for player...';
    if (address.startsWith('p_')) return `${address.slice(2)}`;
    if (address.length > 20) return `${address.slice(0, 4)}...${address.slice(-4)}`;
    return address;
  };

  const getUserRole = () => {
    if (!game) return 'visitor';
    const userSymbol = walletService.getPlayerSymbol(wallet.publicKey);
    
    if (game.player_x === userSymbol) return 'X';
    if (game.player_o === userSymbol) return 'O';
    return 'visitor';
  };

  const isMyTurn = () => {
    if (!game) return false;
    const role = getUserRole();
    if (role === 'visitor') return false;
    return game.current_player === role;
  };

  const canMakeMove = (position: number) => {
    return game?.board[position] === null && 
           game?.status === 'InProgress' && 
           game?.player_o !== 'waiting' &&
           getUserRole() !== 'visitor' &&
           isMyTurn();
  };

  const getStatusMessage = () => {
    if (!game) return '';
    
    const userRole = getUserRole();
    
    if (game.player_o === 'waiting') {
      if (userRole === 'X') {
        return 'Waiting for another player to join...';
      } else {
        return 'Waiting for Player O to join...';
      }
    }
    
    if (game.status !== 'InProgress') {
      switch (game.status) {
        case 'XWins':
          return `${formatAddress(game.player_x)} (X) wins!`;
        case 'OWins':
          return `${formatAddress(game.player_o)} (O) wins!`;
        case 'Draw':
          return "It's a draw!";
      }
    }
    
    if (userRole === 'visitor') {
      const currentPlayer = game.current_player === 'X' ? game.player_x : game.player_o;
      return `👀 Watching - ${formatAddress(currentPlayer)}'s turn`;
    } else if (isMyTurn()) {
      return "Your turn";
    } else {
      const currentPlayer = game.current_player === 'X' ? game.player_x : game.player_o;
      return `Waiting for ${formatAddress(currentPlayer)}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white text-lg">Loading game...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 text-lg mb-4">Game not found</div>
          <button 
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg transition-colors"
            onClick={onBackToList}
          >
            ← Back to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg transition-colors"
            onClick={onBackToList}
          >
            ← Back to Games
          </button>
          <h2 className="text-gray-900 dark:text-white text-xl font-bold">Game #{gameId}</h2>
          <button 
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-3 py-2 rounded-lg transition-colors"
            onClick={() => loadGame()}
          >
            🔄
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center space-x-3 ${getUserRole() === 'X' ? 'bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3' : ''}`}>
              <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">X</span>
              <span className="text-gray-900 dark:text-white">
                {formatAddress(game.player_x)}
                {getUserRole() === 'X' && ' (You)'}
              </span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 font-bold text-lg">VS</div>
            <div className={`flex items-center space-x-3 ${getUserRole() === 'O' ? 'bg-red-100 dark:bg-red-900/50 rounded-lg p-3' : ''}`}>
              <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">O</span>
              <span className="text-gray-900 dark:text-white">
                {formatAddress(game.player_o)}
                {getUserRole() === 'O' && ' (You)'}
              </span>
            </div>
          </div>
          
          {getUserRole() === 'visitor' && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 mb-4">
              <span className="text-yellow-800 dark:text-yellow-300">👀 Watching as visitor</span>
            </div>
          )}
          
          <div className="text-center text-gray-900 dark:text-white font-medium">
            {getStatusMessage()}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-4 mb-6">
            <div className="text-red-800 dark:text-red-300">{error}</div>
          </div>
        )}

        <div className="flex justify-center mb-6">
          <div className="grid grid-cols-3 gap-2 w-80 h-80">
            {game.board.map((cell, index) => (
              <button
                key={index}
                className={`
                  w-full h-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg
                  flex items-center justify-center text-4xl font-bold
                  transition-all duration-200 border-2
                  ${cell === 'X' ? 'text-blue-600 dark:text-blue-400 border-blue-500' : ''}
                  ${cell === 'O' ? 'text-red-600 dark:text-red-400 border-red-500' : ''}
                  ${!cell ? 'border-gray-300 dark:border-gray-600' : ''}
                  ${canMakeMove(index) ? 'hover:border-green-500 cursor-pointer' : 'cursor-not-allowed'}
                  ${makingMove === index ? 'animate-pulse' : ''}
                  disabled:opacity-50
                `}
                onClick={() => canMakeMove(index) && makeMove(index)}
                disabled={!canMakeMove(index) || makingMove !== null}
              >
                {makingMove === index ? '...' : cell}
              </button>
            ))}
          </div>
        </div>

        {game.player_o === 'waiting' && (
          <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg p-6 text-center">
            <p className="text-blue-800 dark:text-blue-300 mb-2">🎮 Share this game ID with a friend to play: <strong className="text-gray-900 dark:text-white">#{gameId}</strong></p>
            <p className="text-blue-700 dark:text-blue-400">Or wait for someone to join from the games list!</p>
          </div>
        )}
      </div>
    </div>
  );
};