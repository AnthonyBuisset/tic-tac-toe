import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSort, FaSortUp, FaSortDown, FaSearch } from 'react-icons/fa';
import { GameInfo, WalletConnection, WalletService } from '../wallet';

interface GamesTableProps {
  games: GameInfo[];
  wallet: WalletConnection;
  walletService: WalletService;
  onJoinGame: (gameId: number) => Promise<void>;
  onClaimRewards: (gameId: number) => Promise<void>;
}

type SortField = 'id' | 'status' | 'bet_amount';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'waiting' | 'active' | 'finished';

export const GamesTable: React.FC<GamesTableProps> = ({
  games,
  wallet,
  walletService,
  onJoinGame,
  onClaimRewards,
}) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getGameStatus = (game: GameInfo) => {
    if (game.status === 'XWins' || game.status === 'OWins' || game.status === 'Draw' || game.status === 'Claimed') return 'finished';
    if (game.player_o === 'waiting') return 'waiting';
    return 'active';
  };

  const filteredAndSortedGames = useMemo(() => {
    let filtered = games;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = games.filter(game => getGameStatus(game) === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(game => 
        game.id.toString().includes(searchTerm) ||
        game.player_x.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (game.player_o !== 'waiting' && game.player_o.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortField === 'id') {
        aValue = a.id;
        bValue = b.id;
      } else if (sortField === 'status') {
        aValue = getGameStatus(a);
        bValue = getGameStatus(b);
      } else if (sortField === 'bet_amount') {
        aValue = a.bet_amount || 0;
        bValue = b.bet_amount || 0;
      } else {
        aValue = 0;
        bValue = 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [games, sortField, sortDirection, statusFilter, searchTerm]);

  const getStatusBadge = (game: GameInfo) => {
    const status = getGameStatus(game);
    const badges = {
      waiting: { 
        text: 'Waiting for Player', 
        className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' 
      },
      active: { 
        text: 'In Progress', 
        className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
      },
      finished: { 
        text: 'Finished', 
        className: 'bg-green-500/20 text-green-300 border-green-500/30' 
      },
    };

    const badge = badges[status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const getPlayerActions = (game: GameInfo) => {
    const userSymbol = walletService.getPlayerSymbol(wallet.publicKey);
    const isPlayerX = game.player_x === userSymbol;
    const isPlayerO = game.player_o === userSymbol;
    const canJoinAsPlayer = game.player_o === 'waiting' && !isPlayerX;
    const alreadyInGame = isPlayerX || isPlayerO;
    const status = getGameStatus(game);

    if (status === 'finished') {
      const hasWon = (game.status === 'XWins' && isPlayerX) || (game.status === 'OWins' && isPlayerO);
      const canClaimRewards = hasWon && game.bet_amount && game.bet_amount > 0;
      
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/games/${game.id}`)}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            View
          </button>
          {canClaimRewards && (
            <button
              onClick={() => onClaimRewards(game.id)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            >
              Claim Rewards
            </button>
          )}
        </div>
      );
    }

    if (canJoinAsPlayer) {
      return (
        <button
          onClick={() => onJoinGame(game.id)}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        >
          Join Game
        </button>
      );
    }

    if (alreadyInGame || status === 'active') {
      return (
        <button
          onClick={() => navigate(`/games/${game.id}`)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        >
          {alreadyInGame ? 'Play' : 'Watch'}
        </button>
      );
    }

    return (
      <button
        onClick={() => navigate(`/games/${game.id}`)}
        className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      >
        View
      </button>
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <FaSort className="w-4 h-4 text-slate-500" />
      );
    }
    
    return sortDirection === 'asc' ? (
      <FaSortDown className="w-4 h-4 text-blue-400" />
    ) : (
      <FaSortUp className="w-4 h-4 text-blue-400" />
    );
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
      {/* Filters and Search */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-white">Games</h2>
            <div className="flex items-center space-x-2">
              {(['all', 'waiting', 'active', 'finished'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-64"
            />
            <FaSearch className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th 
                className="text-left p-4 text-slate-300 font-semibold cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center space-x-2">
                  <span>Game ID</span>
                  <SortIcon field="id" />
                </div>
              </th>
              <th 
                className="text-left p-4 text-slate-300 font-semibold cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-2">
                  <span>Status</span>
                  <SortIcon field="status" />
                </div>
              </th>
              <th className="text-left p-4 text-slate-300 font-semibold">Players</th>
              <th 
                className="text-left p-4 text-slate-300 font-semibold cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('bet_amount')}
              >
                <div className="flex items-center space-x-2">
                  <span>Bet Amount</span>
                  <SortIcon field="bet_amount" />
                </div>
              </th>
              <th className="text-left p-4 text-slate-300 font-semibold">
                Winner
              </th>
              <th className="text-right p-4 text-slate-300 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedGames.map((game) => (
              <tr key={game.id} className="border-t border-slate-700 hover:bg-slate-800/30 transition-colors">
                <td className="p-4">
                  <span className="text-white font-mono">#{game.id}</span>
                </td>
                <td className="p-4">
                  {getStatusBadge(game)}
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-400 font-medium">X:</span>
                      <span className="text-white text-sm font-mono">
                        {game.player_x.slice(0, 8)}...{game.player_x.slice(-4)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-red-400 font-medium">O:</span>
                      <span className="text-white text-sm font-mono">
                        {game.player_o === 'waiting' 
                          ? 'Waiting for player...' 
                          : `${game.player_o.slice(0, 8)}...${game.player_o.slice(-4)}`
                        }
                      </span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  {game.bet_amount ? (
                    <div className="flex items-center space-x-1">
                      <span className="text-green-400 font-semibold">
                        {game.bet_amount.toLocaleString()}
                      </span>
                      <span className="text-slate-400 text-sm">XLM</span>
                    </div>
                  ) : (
                    <span className="text-slate-500">Free</span>
                  )}
                </td>
                <td className="p-4">
                  {game.status === 'XWins' ? (
                    <span className="text-blue-400 font-medium">Player X</span>
                  ) : game.status === 'OWins' ? (
                    <span className="text-red-400 font-medium">Player O</span>
                  ) : game.status === 'Draw' ? (
                    <span className="text-yellow-400 font-medium">Draw</span>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {getPlayerActions(game)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedGames.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 text-lg mb-2">No games found</div>
            <div className="text-slate-500 text-sm">
              {statusFilter !== 'all' || searchTerm 
                ? 'Try adjusting your filters or search term'
                : 'Create a new game to get started'
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
