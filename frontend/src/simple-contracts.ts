// Simplified contract integration using the generated bindings
import { Keypair } from '@stellar/stellar-sdk';

// For development, we'll use a simplified approach with test keys
export const TEST_ACCOUNTS = {
  alice: Keypair.random(),
  bob: Keypair.random(),
};

export interface Player {
  tag: 'X' | 'O';
}

export interface GameStatus {
  tag: 'InProgress' | 'XWins' | 'OWins' | 'Draw';
}

export interface Game {
  board: (Player | null)[];
  current_player: Player;
  player_x: string;
  player_o: string;
  status: GameStatus;
}

export const NETWORKS = {
  local: {
    name: 'Local',
    rpcUrl: 'http://localhost:8000/soroban/rpc',
    passphrase: 'Standalone Network ; February 2017',
  },
  testnet: {
    name: 'Testnet', 
    rpcUrl: 'https://soroban-testnet.stellar.org',
    passphrase: 'Test SDF Network ; September 2015',
  },
} as const;

export type NetworkType = keyof typeof NETWORKS;

// For the demo, we'll simulate the contract interaction
export class SimpleTicTacToeContract {
  private games: Map<number, Game> = new Map();
  private nextGameId: number = 1;

  constructor(_network: NetworkType) {}

  async createGame(playerX: string, playerO: string): Promise<number> {
    const gameId = this.nextGameId++;
    const game: Game = {
      board: Array(9).fill(null),
      current_player: { tag: 'X' },
      player_x: playerX,
      player_o: playerO,
      status: { tag: 'InProgress' },
    };
    
    this.games.set(gameId, game);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return gameId;
  }

  async makeMove(gameId: number, player: string, position: number): Promise<Game> {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status.tag !== 'InProgress') {
      throw new Error('Game is finished');
    }

    if (game.board[position] !== null) {
      throw new Error('Position already taken');
    }

    // Check if it's the correct player's turn
    const expectedPlayer = game.current_player.tag === 'X' ? game.player_x : game.player_o;
    if (player !== expectedPlayer) {
      throw new Error(`It's ${expectedPlayer}'s turn`);
    }

    // Make the move
    game.board[position] = { tag: game.current_player.tag };

    // Check for win
    if (this.checkWin(game.board, game.current_player.tag)) {
      game.status = { tag: game.current_player.tag === 'X' ? 'XWins' : 'OWins' };
    } else if (game.board.every(cell => cell !== null)) {
      game.status = { tag: 'Draw' };
    } else {
      // Switch player
      game.current_player = { tag: game.current_player.tag === 'X' ? 'O' : 'X' };
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return { ...game };
  }

  async getGame(gameId: number): Promise<Game> {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    return { ...game };
  }

  private checkWin(board: (Player | null)[], player: 'X' | 'O'): boolean {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    return winPatterns.some(pattern =>
      pattern.every(index => board[index]?.tag === player)
    );
  }
}