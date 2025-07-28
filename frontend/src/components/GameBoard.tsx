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
  }, [gameId, walletService]);

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
      <div className="game-board-container">
        <div className="loading">Loading game...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="game-board-container">
        <div className="error">Game not found</div>
        <button className="back-button" onClick={onBackToList}>
          ← Back to Games
        </button>
      </div>
    );
  }

  return (
    <div className="game-board-container">
      <div className="game-board-header">
        <button className="back-button" onClick={onBackToList}>
          ← Back to Games
        </button>
        <h2>Game #{gameId}</h2>
        <div className="refresh-button" onClick={() => loadGame()}>
          🔄
        </div>
      </div>

      <div className="game-info">
        <div className="players-info">
          <div className={`player ${getUserRole() === 'X' ? 'current-user' : ''}`}>
            <span className="player-symbol x">X</span>
            <span className="player-name">
              {formatAddress(game.player_x)}
              {getUserRole() === 'X' && ' (You)'}
            </span>
          </div>
          <div className="vs">VS</div>
          <div className={`player ${getUserRole() === 'O' ? 'current-user' : ''}`}>
            <span className="player-symbol o">O</span>
            <span className="player-name">
              {formatAddress(game.player_o)}
              {getUserRole() === 'O' && ' (You)'}
            </span>
          </div>
        </div>
        
        {getUserRole() === 'visitor' && (
          <div className="visitor-badge">
            👀 Watching as visitor
          </div>
        )}
        
        <div className="game-status-message">
          {getStatusMessage()}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="board-container">
        <div className="tic-tac-toe-board">
          {game.board.map((cell, index) => (
            <button
              key={index}
              className={`board-cell ${cell ? 'filled' : ''} ${
                canMakeMove(index) ? 'playable' : ''
              } ${makingMove === index ? 'making-move' : ''}`}
              onClick={() => canMakeMove(index) && makeMove(index)}
              disabled={!canMakeMove(index) || makingMove !== null}
            >
              {makingMove === index ? '...' : cell}
            </button>
          ))}
        </div>
      </div>

      {game.player_o === 'waiting' && (
        <div className="waiting-message">
          <p>🎮 Share this game ID with a friend to play: <strong>#{gameId}</strong></p>
          <p>Or wait for someone to join from the games list!</p>
        </div>
      )}
    </div>
  );
};