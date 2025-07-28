import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GamesList } from '../components/GamesList';
import { WalletConnection, WalletService, GameInfo } from '../wallet';

interface GamesListPageProps {
  wallet: WalletConnection;
  walletService: WalletService;
}

export const GamesListPage: React.FC<GamesListPageProps> = ({ wallet, walletService }) => {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingGame, setCreatingGame] = useState(false);
  const [joiningGame, setJoiningGame] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadGames = useCallback(async (showLoading = true) => {
    if (!wallet) return;
    
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const gamesList = await walletService.listGames(wallet);
      setGames(gamesList);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load games');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [wallet, walletService]);

  const handleCreateGame = async () => {
    if (!wallet) return;

    setCreatingGame(true);
    setError(null);
    try {
      const gameId = await walletService.createGame(wallet);
      console.log(`🎮 [Navigation] Navigating to game ${gameId}`);
      // Navigate to the game page with shareable URL
      navigate(`/games/${gameId}`);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to create game');
    } finally {
      setCreatingGame(false);
    }
  };

  const handleJoinGame = async (gameId: number) => {
    if (!wallet) return;

    setJoiningGame(gameId);
    setError(null);
    try {
      // Find the game to check if user can join as player
      const game = games.find(g => g.id === gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      // Check if user can join as a player
      const userSymbol = walletService.getPlayerSymbol(wallet.publicKey);
      const isPlayerX = game.player_x === userSymbol;
      const isPlayerO = game.player_o === userSymbol;
      const canJoinAsPlayer = game.player_o === 'waiting' && !isPlayerX;
      const alreadyInGame = isPlayerX || isPlayerO;

      if (canJoinAsPlayer) {
        // Join as player O
        await walletService.joinGame(wallet, gameId);
        console.log(`🎮 [Join] Joined game ${gameId} as Player O`);
      } else if (alreadyInGame) {
        // Already in game, just navigate to board
        console.log(`🎮 [Rejoin] Rejoining existing game ${gameId}`);
      } else {
        // Join as visitor (both spots are taken)
        console.log(`👀 [Watch] Watching game ${gameId} as visitor`);
      }

      // Navigate to the game page with shareable URL
      console.log(`🎮 [Navigation] Navigating to game ${gameId}`);
      navigate(`/games/${gameId}`);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to join game');
    } finally {
      setJoiningGame(null);
    }
  };

  // Auto-refresh games every 10 seconds (without showing loading)
  useEffect(() => {
    if (!wallet) return;

    // Load games initially
    loadGames();

    const interval = setInterval(() => {
      loadGames(false); // Don't show loading for background refresh
    }, 10000);

    return () => clearInterval(interval);
  }, [wallet, loadGames]);

  return (
    <GamesList
      games={games}
      wallet={wallet}
      onCreateGame={handleCreateGame}
      onJoinGame={handleJoinGame}
      onRefresh={() => loadGames(true)}
      loading={loading}
      error={error}
      creatingGame={creatingGame}
      joiningGame={joiningGame}
    />
  );
};
