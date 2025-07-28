import React from 'react';
import { GameInfo, WalletConnection } from '../wallet';

interface GamesListProps {
  games: GameInfo[];
  wallet: WalletConnection;
  onCreateGame: () => void;
  onJoinGame: (gameId: number) => void;
  onRefresh: () => void;
  loading: boolean;
  error: string | null;
  creatingGame: boolean;
  joiningGame: number | null;
}

export const GamesList: React.FC<GamesListProps> = ({
  games,
  wallet,
  onCreateGame,
  onJoinGame,
  onRefresh,
  loading,
  error,
  creatingGame,
  joiningGame
}) => {
  const formatAddress = (address: string) => {
    if (address === 'waiting') return 'Waiting for player...';
    // Handle symbol format (starts with p_)
    if (address.startsWith('p_')) return `${address.slice(2)}`;
    // Handle full Stellar address
    if (address.length > 20) return `${address.slice(0, 4)}...${address.slice(-4)}`;
    return address;
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'InProgress':
        return 'status-in-progress';
      case 'XWins':
      case 'OWins':
      case 'Draw':
        return 'status-finished';
      default:
        return 'status-waiting';
    }
  };

  const getStatusText = (status: string, playerO: string) => {
    if (playerO === 'waiting') return 'Waiting for player';
    switch (status) {
      case 'InProgress':
        return 'In Progress';
      case 'XWins':
        return 'X Wins';
      case 'OWins':
        return 'O Wins';
      case 'Draw':
        return 'Draw';
      default:
        return status;
    }
  };

  const getJoinStatus = (game: GameInfo) => {
    // Create user symbol for comparison
    const userSymbol = `p_${wallet.publicKey.slice(-8)}`;
    const isPlayerX = game.player_x === userSymbol;
    const isPlayerO = game.player_o === userSymbol;
    const isWaiting = game.player_o === 'waiting';
    const isNotCreator = !isPlayerX;



    if (isPlayerX || isPlayerO) {
      return { canJoin: true, buttonText: 'Continue Game', type: 'rejoin' };
    } else if (isWaiting && isNotCreator) {
      return { canJoin: true, buttonText: 'Join as Player O', type: 'join' };
    } else if (!isWaiting) {
      return { canJoin: true, buttonText: 'Watch Game', type: 'watch' };
    }
    
    return { canJoin: false, buttonText: '', type: 'none' };
  };

  return (
    <div className="games-container">
      <div className="wallet-info">
        <div>
          <strong>Connected:</strong> {formatAddress(wallet.publicKey)}
        </div>
        <div className="wallet-address">
          Testnet
        </div>
      </div>

      <div className="games-header">
        <div>
          <h2>Games</h2>
          {games.length > 0 && (
            <span className="games-count">
              {games.length} game{games.length !== 1 ? 's' : ''} available
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="create-game-button"
            onClick={onCreateGame}
            disabled={creatingGame}
          >
            {creatingGame ? 'Creating...' : '+ Create New Game'}
          </button>
          <button 
            className="create-game-button"
            onClick={onRefresh}
            disabled={loading}
            style={{ background: 'linear-gradient(135deg, #646cff, #535bf2)' }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading games...</div>
      ) : (
        <div className="games-list">
          {games.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎮</div>
              <h3>No games yet</h3>
              <p>Be the first to create a game and challenge someone!</p>
            </div>
          ) : (
            games.map((game) => (
              <div key={game.id} className="game-card">
                <div className="game-header">
                  <span className="game-id">Game #{game.id}</span>
                  <span className={`game-status ${getStatusClass(game.status)}`}>
                    {getStatusText(game.status, game.player_o)}
                  </span>
                </div>
                
                <div className="game-players">
                  <div><strong>Player X:</strong> {formatAddress(game.player_x)}</div>
                  <div><strong>Player O:</strong> {formatAddress(game.player_o)}</div>
                </div>

                {(() => {
                  const joinStatus = getJoinStatus(game);
                  return joinStatus.canJoin && (
                    <button
                      className={`join-button ${joinStatus.type === 'watch' ? 'watch-button' : ''}`}
                      onClick={() => onJoinGame(game.id)}
                      disabled={joiningGame === game.id}
                    >
                      {joiningGame === game.id ? 'Loading...' : joinStatus.buttonText}
                    </button>
                  );
                })()}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};