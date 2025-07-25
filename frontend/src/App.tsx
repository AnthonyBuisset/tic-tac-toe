import React, { useEffect, useState } from 'react';
import { SafeWalletManager, WalletState } from './safe-wallet';
import { Game, NETWORKS, NetworkType, Player, SimpleTicTacToeContract } from './simple-contracts';

const App: React.FC = () => {
  const [network, setNetwork] = useState<NetworkType>('local');
  const [wallet, setWallet] = useState<WalletState>({ isConnected: false, publicKey: null, error: null });
  const [contract, setContract] = useState<SimpleTicTacToeContract | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [gameId, setGameId] = useState<number | null>(null);
  const [joinGameId, setJoinGameId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [opponentName, setOpponentName] = useState<string>('');
  const [useTestAccounts, setUseTestAccounts] = useState(true);

  const walletManager = new SafeWalletManager();

  useEffect(() => {
    setContract(new SimpleTicTacToeContract(network));
  }, [network]);

  const connectWallet = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Add a delay to ensure Freighter has time to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await walletManager.connect();
      setWallet(result);
      
      if (result.error) {
        setError(`${result.error}\n\nTroubleshooting:\n• Make sure Freighter extension is installed\n• Refresh the page after installing\n• Check if Freighter is enabled in your browser\n• Try disabling other wallet extensions temporarily`);
      } else {
        setSuccess('Wallet connected successfully!');
        setPlayerName(result.publicKey?.slice(0, 8) || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const createGame = async () => {
    if (!contract || (!wallet.isConnected && !useTestAccounts)) {
      setError('Please connect your wallet first');
      return;
    }

    if (!playerName || !opponentName) {
      setError('Please enter both player names');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const newGameId = await contract.createGame(playerName, opponentName);
      setGameId(newGameId);
      
      // Fetch the created game
      const gameData = await contract.getGame(newGameId);
      setGame(gameData);
      
      setSuccess(`Game created! Game ID: ${newGameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async () => {
    if (!contract || !joinGameId) {
      setError('Please enter a game ID');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const gameData = await contract.getGame(parseInt(joinGameId));
      setGame(gameData);
      setGameId(parseInt(joinGameId));
      setSuccess(`Joined game ${joinGameId}!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  const makeMove = async (position: number) => {
    if (!contract || !game || !gameId || game.status.tag !== 'InProgress') {
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
      
      if (updatedGame.status.tag !== 'InProgress') {
        setSuccess(`Game finished! ${getGameStatusMessage(updatedGame.status.tag)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make move');
    } finally {
      setLoading(false);
    }
  };

  const getGameStatusMessage = (status: string): string => {
    switch (status) {
      case 'XWins':
        return 'X wins!';
      case 'OWins':
        return 'O wins!';
      case 'Draw':
        return "It's a draw!";
      default:
        return 'Game in progress';
    }
  };

  const getCellDisplay = (cell: Player | null): string => {
    if (!cell) return '';
    return cell.tag;
  };

  const resetGame = () => {
    setGame(null);
    setGameId(null);
    setJoinGameId('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="container">
      <h1>🎮 Stellar Tic-Tac-Toe</h1>
      
      {/* Network Selection */}
      <div className="network-selector">
        <label>
          Network: 
          <select value={network} onChange={(e) => setNetwork(e.target.value as NetworkType)}>
            {Object.entries(NETWORKS).map(([key, net]) => (
              <option key={key} value={key}>{net.name}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Test Accounts Toggle */}
      <div className="network-selector">
        <label>
          <input 
            type="checkbox" 
            checked={useTestAccounts} 
            onChange={(e) => setUseTestAccounts(e.target.checked)}
          />
          Use test accounts (for local development)
        </label>
      </div>

      {/* Wallet Connection */}
      {!useTestAccounts && (
        <div className="wallet-connection">
          <h3>Wallet Connection</h3>
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
      )}

      {/* Error/Success Messages */}
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Game Controls */}
      {!game ? (
        <div className="game-controls">
          <div>
            <h3>Create New Game</h3>
            <input
              type="text"
              placeholder="Player X name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Player O name"
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
            />
            <button onClick={createGame} disabled={loading}>
              {loading ? 'Creating...' : 'Create Game'}
            </button>
          </div>
          
          <div>
            <h3>Join Existing Game</h3>
            <input
              type="text"
              placeholder="Game ID"
              value={joinGameId}
              onChange={(e) => setJoinGameId(e.target.value)}
            />
            <button onClick={joinGame} disabled={loading}>
              {loading ? 'Joining...' : 'Join Game'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Game Info */}
          <div className="game-info">
            <h3>Game {gameId}</h3>
            <p>Player X: {game.player_x}</p>
            <p>Player O: {game.player_o}</p>
            <p>Current Turn: {game.current_player.tag}</p>
            <p>Status: {getGameStatusMessage(game.status.tag)}</p>
          </div>

          {/* Game Board */}
          <div className="game-board">
            {game.board.map((cell, index) => (
              <button
                key={index}
                className="game-cell"
                onClick={() => makeMove(index)}
                disabled={loading || cell !== null || game.status.tag !== 'InProgress'}
              >
                {getCellDisplay(cell)}
              </button>
            ))}
          </div>

          {/* Reset Game */}
          <div className="game-controls">
            <button onClick={resetGame}>
              New Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;