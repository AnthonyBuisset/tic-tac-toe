import React, { useCallback, useEffect, useState } from 'react';
import { FaGamepad } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { CreateGameModal } from '../components/CreateGameModal';
import { DepositWithdrawModal } from '../components/DepositWithdrawModal';
import { ModernHeader } from '../components/ModernHeader';
import { GameInfo, TokenType, UserBalance, WalletConnection, WalletService } from '../wallet';

interface ModernGamesListPageProps {
  wallet: WalletConnection;
  walletService: WalletService;
}

export const ModernGamesListPage: React.FC<ModernGamesListPageProps> = ({ wallet, walletService }) => {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameInfo[]>([]);
  const [balance, setBalance] = useState<UserBalance>({ native: 0, tokens: [] });
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  const loadGames = useCallback(async () => {
    setLoading(true);
    try {
      const gamesList = await walletService.listGames(wallet);
      setGames(gamesList);
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setLoading(false);
    }
  }, [wallet, walletService]);

  const loadBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const userBalance = await walletService.getBalance(wallet);
      setBalance(userBalance);
    } catch (err) {
      console.error('Failed to load balance:', err);
    } finally {
      setBalanceLoading(false);
    }
  }, [wallet, walletService]);

  const getGameStatus = (game: GameInfo) => {
    if (game.status === 'XWins' || game.status === 'OWins' || game.status === 'Draw' || game.status === 'Claimed') return 'finished';
    if (game.player_o === 'waiting') return 'waiting';
    return 'active';
  };

  const getStatusBadge = (game: GameInfo) => {
    const status = getGameStatus(game);
    const badges = {
      waiting: { text: 'Waiting', className: 'bg-yellow-600 text-yellow-100' },
      active: { text: 'Active', className: 'bg-blue-600 text-blue-100' },
      finished: { text: 'Finished', className: 'bg-green-600 text-green-100' },
    };
    const badge = badges[status];
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  useEffect(() => {
    loadGames();
    loadBalance();
  }, [loadGames, loadBalance]);

  const handleCreateGame = () => {
    setShowCreateModal(true);
  };

  const handleManageBalance = () => {
    setShowDepositModal(true);
  };

  const handleCreateGameSubmit = async () => {
    try {
      const gameId = await walletService.createGame(wallet);
      console.log(`🎮 [Navigation] Navigating to game ${gameId}`);
      navigate(`/games/${gameId}`);
      await loadGames(); // Refresh games list
      setShowCreateModal(false);
    } catch (err: unknown) {
      console.error('Failed to create game:', err);
      throw err; // Let the modal handle the error
    }
  };

  const handleCreateGameWithBet = async (betAmount: number, tokenType: TokenType) => {
    try {
      const gameId = await walletService.createGameWithBet(wallet, betAmount, tokenType);
      console.log(`🎮 [Navigation] Navigating to betting game ${gameId}`);
      navigate(`/games/${gameId}`);
      await loadGames(); // Refresh games list
      await loadBalance(); // Refresh balance
      setShowCreateModal(false);
    } catch (err: unknown) {
      console.error('Failed to create betting game:', err);
      throw err; // Re-throw to let the modal handle it
    }
  };

  const handleDeposit = async (isNative: boolean, tokenAddress: string, amount: number) => {
    if (isNative) {
      await walletService.depositNative(wallet, amount);
    } else {
      await walletService.depositToken(wallet, tokenAddress, amount);
    }
    await loadBalance(); // Refresh balance after deposit
  };

  const handleWithdraw = async (isNative: boolean, tokenAddress: string, amount: number) => {
    if (isNative) {
      await walletService.withdrawNative(wallet, amount);
    } else {
      await walletService.withdrawToken(wallet, tokenAddress, amount);
    }
    await loadBalance(); // Refresh balance after withdrawal
  };

  const handleJoinGame = async (gameId: number) => {
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
        await loadBalance(); // Refresh balance after joining betting game
      } else if (alreadyInGame) {
        // Already in game, just navigate to board
        console.log(`🎮 [Rejoin] Rejoining existing game ${gameId}`);
      } else {
        // Join as visitor (both spots are taken)
        console.log(`👀 [Watch] Watching game ${gameId} as visitor`);
      }

      // Navigate to the game page
      console.log(`🛤️ [Navigation] Navigating to game ${gameId}`);
      navigate(`/games/${gameId}`);
      await loadGames(); // Refresh games list
    } catch (err: unknown) {
      console.error('Failed to join game:', err);
      // You could show an error toast here
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <ModernHeader
        balance={balance}
        balanceLoading={balanceLoading}
        onManageBalance={handleManageBalance}
        onCreateGame={handleCreateGame}
        onRefresh={() => loadGames()}
        loading={loading}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Games content would go here - for now showing empty state */}
        {games.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaGamepad className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Games Yet</h3>
            <p className="text-slate-400 mb-6">Ready to start playing? Create your first game!</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Create Your First Game
            </button>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="text-left p-4 text-slate-300 font-semibold">Game ID</th>
                  <th className="text-left p-4 text-slate-300 font-semibold">Status</th>
                  <th className="text-left p-4 text-slate-300 font-semibold">Players</th>
                  <th className="text-left p-4 text-slate-300 font-semibold">Bet Amount</th>
                  <th className="text-right p-4 text-slate-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr key={game.id} className="border-t border-slate-700 hover:bg-slate-750">
                    <td className="p-4">
                      <span className="text-white font-mono">#{game.id}</span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(game)}
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-white text-sm">
                          <span className="text-blue-400 font-medium">X:</span> {game.player_x.slice(0, 8)}...
                        </div>
                        <div className="text-white text-sm">
                          <span className="text-red-400 font-medium">O:</span> {
                            game.player_o === 'waiting' ? 'Waiting...' : `${game.player_o.slice(0, 8)}...`
                          }
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {game.bet_amount > 0 ? (
                        <span className="text-green-400 font-semibold">{game.bet_amount} XLM</span>
                      ) : (
                        <span className="text-slate-500">Free</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="space-x-2">
                        <button
                          onClick={() => navigate(`/games/${game.id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          View
                        </button>
                        {game.player_o === 'waiting' && (
                          <button 
                            onClick={() => handleJoinGame(game.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Join
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateGameModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        balance={balance}
        onCreateGame={handleCreateGameSubmit}
        onCreateGameWithBet={handleCreateGameWithBet}
      />

      <DepositWithdrawModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        balance={balance}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
        onRefreshBalance={loadBalance}
      />
    </div>
  );
};
