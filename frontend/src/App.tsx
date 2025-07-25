import React, { useEffect, useState } from 'react';
import { TicTacToeContract as ContractClient, Game, GameInfo, NETWORK, Player } from './real-contracts';
import { SafeWalletManager, WalletState } from './safe-wallet';

type AppView = 'wallet' | 'gameList' | 'gameLobby' | 'gamePlay';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('wallet');
  const [wallet, setWallet] = useState<WalletState>({ isConnected: false, publicKey: null, error: null });
  const [contract, setContract] = useState<ContractClient | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [gameId, setGameId] = useState<number | null>(null);
  const [gamesList, setGamesList] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');

  const walletManager = new SafeWalletManager();

  useEffect(() => {
    if (wallet.isConnected) {
      setContract(new ContractClient(walletManager));
    }
  }, [wallet.isConnected]);

  useEffect(() => {
    if (wallet.isConnected && wallet.publicKey) {
      // Generate a valid player name from the public key
      const sanitizedName = wallet.publicKey
        .replace(/[^a-zA-Z0-9_]/g, '') // Remove invalid characters
        .slice(0, 16) // Reasonable length for display
        .toLowerCase();
      setPlayerName(sanitizedName || 'player');
      setView('gameList');
      loadGamesList();
    }
  }, [wallet.isConnected]);

  const connectWallet = async () => {
    setLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await walletManager.connect();
      setWallet(result);
      
      if (result.error) {
        setError(`${result.error}\n\nTroubleshooting:\n• Make sure Freighter extension is installed\n• Refresh the page after installing\n• Check if Freighter is enabled in your browser\n• Try disabling other wallet extensions temporarily`);
      } else {
        setSuccess('Wallet connected successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const loadGamesList = async () => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const games = await contract.getAvailableGames();
      setGamesList(games);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const createGame = async () => {
    if (!contract || !wallet.isConnected || !playerName) {
      setError('Please enter your player name');
      return;
    }

    // Validate player name before sending
    const sanitizedName = playerName.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32);
    if (!sanitizedName) {
      setError('Player name must contain at least one alphanumeric character or underscore');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const newGameId = await contract.createGame(sanitizedName);
      setGameId(newGameId);
      
      const gameData = await contract.getGame(newGameId);
      setGame(gameData);
      setView('gameLobby');
      setSuccess(`Game created! Game ID: ${newGameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async (gameId: number) => {
    if (!contract || !playerName) {
      setError('Player name is required');
      return;
    }

    // Validate player name before sending
    const sanitizedName = playerName.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32);
    if (!sanitizedName) {
      setError('Player name must contain at least one alphanumeric character or underscore');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const gameData = await contract.joinGame(gameId, sanitizedName);
      setGame(gameData);
      setGameId(gameId);
      setView('gamePlay');
      setSuccess(`Joined game ${gameId}!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  const makeMove = async (position: number) => {
    if (!contract || !game || !gameId || !game.status || game.status.tag !== 'InProgress') {
      return;
    }

    if (game.board[position] !== null) {
      setError('Position already taken!');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const currentPlayerName = game.current_player.tag === 'X' ? game.player_x : game.player_o;
      
      const updatedGame = await contract.makeMove(gameId, currentPlayerName, position);
      setGame(updatedGame);
      
      if (updatedGame.status && updatedGame.status.tag !== 'InProgress') {
        setSuccess(`Game finished! ${getGameStatusMessage(updatedGame.status.tag)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make move');
    } finally {
      setLoading(false);
    }
  };

  const getGameStatusMessage = (status: string | undefined): string => {
    if (!status) {
      return 'Loading...';
    }
    
    switch (status) {
      case 'XWins':
        return 'X wins!';
      case 'OWins':
        return 'O wins!';
      case 'Draw':
        return "It's a draw!";
      case 'InProgress':
        return 'Game in progress';
      default:
        return 'Unknown status';
    }
  };

  const getCellDisplay = (cell: Player | null | undefined): string => {
    if (!cell) return '';
    return cell.tag;
  };

  const getGameStatus = (gameInfo: GameInfo): string => {
    if (gameInfo.player_o === 'waiting') {
      return 'Waiting for player';
    }
    return getGameStatusMessage(gameInfo.status.tag);
  };

  const goBackToGamesList = () => {
    setGame(null);
    setGameId(null);
    setError('');
    setSuccess('');
    setView('gameList');
    loadGamesList();
  };

  const renderWalletConnection = () => (
    <div className="container">
      <h1>🎮 Stellar Tic-Tac-Toe</h1>
      <div className="network-info">
        <p>🌐 Network: <strong>{NETWORK.name}</strong></p>
        <p>📍 Contract: <code>{NETWORK.contractId}</code></p>
      </div>
      
      <div className="wallet-connection">
        <h3>Connect Your Wallet</h3>
        <p>You need to connect your Freighter wallet to play on Stellar Testnet.</p>
        
        {wallet.isConnected ? (
          <div>
            <p>✅ Connected: {wallet.publicKey?.slice(0, 8)}...{wallet.publicKey?.slice(-8)}</p>
          </div>
        ) : (
          <button onClick={connectWallet} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Freighter Wallet'}
          </button>
        )}
      </div>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );

  const renderGamesList = () => (
    <div className="container">
      <h1>🎮 Stellar Tic-Tac-Toe</h1>
      
      <div className="player-info">
        <p>👤 Player: <strong>{playerName}</strong></p>
        <p>🔑 Wallet: {wallet.publicKey?.slice(0, 8)}...{wallet.publicKey?.slice(-8)}</p>
      </div>

      <div className="game-actions">
        <div className="create-game">
          <h3>Create New Game</h3>
          <input
            type="text"
            placeholder="Your name (letters, numbers, _ only)"
            value={playerName}
            onChange={(e) => {
              // Only allow valid Symbol characters
              const sanitized = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32);
              setPlayerName(sanitized);
            }}
          />
          <button onClick={createGame} disabled={loading || !playerName}>
            {loading ? 'Creating...' : 'Create Game'}
          </button>
        </div>
      </div>

      <div className="games-list">
        <h3>Available Games</h3>
        <button onClick={loadGamesList} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh List'}
        </button>
        
        {gamesList.length === 0 ? (
          <p>No games available. Create the first one!</p>
        ) : (
          <div className="games-grid">
            {gamesList.map((gameInfo) => (
              <div key={gameInfo.id} className="game-card">
                <h4>Game #{gameInfo.id}</h4>
                <p>Creator: {gameInfo.player_x}</p>
                <p>Opponent: {gameInfo.player_o === 'waiting' ? 'Waiting...' : gameInfo.player_o}</p>
                <p>Status: {getGameStatus(gameInfo)}</p>
                <button 
                  onClick={() => joinGame(gameInfo.id)}
                  disabled={loading || (gameInfo.player_o !== 'waiting' && gameInfo.player_x !== playerName)}
                >
                  {gameInfo.player_o === 'waiting' ? 'Join Game' : 
                   (gameInfo.player_x === playerName || gameInfo.player_o === playerName) ? 'Continue Game' : 'View Game'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );

  const renderGameLobby = () => (
    <div className="container">
      <h1>🎮 Game Lobby</h1>
      
      <div className="game-info">
        <h3>Game #{gameId}</h3>
        <p>Creator: {game?.player_x}</p>
        <p>Status: {game?.player_o === 'waiting' ? 'Waiting for opponent to join...' : 'Ready to play!'}</p>
      </div>

      <div className="lobby-actions">
        <button onClick={goBackToGamesList}>
          Back to Games List
        </button>
        <button onClick={() => game && setView('gamePlay')} disabled={!game || game.player_o === 'waiting'}>
          Start Game
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );

  const renderGamePlay = () => (
    <div className="container">
      <h1>🎮 Tic-Tac-Toe Game</h1>
      
      <div className="game-info">
        <h3>Game #{gameId}</h3>
        <p>Player X: {game?.player_x}</p>
        <p>Player O: {game?.player_o}</p>
        <p>Current Turn: {game?.current_player?.tag || 'Unknown'}</p>
        <p>Status: {getGameStatusMessage(game?.status?.tag)}</p>
      </div>

      <div className="game-board">
        {game?.board.map((cell, index) => (
          <button
            key={index}
            className="game-cell"
            onClick={() => makeMove(index)}
            disabled={loading || cell !== null || !game.status || game.status.tag !== 'InProgress'}
          >
            {getCellDisplay(cell)}
          </button>
        ))}
      </div>

      <div className="game-actions">
        <button onClick={goBackToGamesList}>
          Back to Games List
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );

  // Render the appropriate view
  switch (view) {
    case 'wallet':
      return renderWalletConnection();
    case 'gameList':
      return renderGamesList();
    case 'gameLobby':
      return renderGameLobby();
    case 'gamePlay':
      return renderGamePlay();
    default:
      return renderWalletConnection();
  }
};

export default App;