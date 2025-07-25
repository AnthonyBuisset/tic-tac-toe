import {
  Game as ContractGame,
  GameInfo as ContractGameInfo,
  GameStatus as ContractGameStatus,
  Player as ContractPlayer,
  Client as TicTacToeClient
} from '../../bindings/dist/index.js';
import { SafeWalletManager } from './safe-wallet';

// Re-export types for the frontend to use
export type Player = ContractPlayer;
export type GameStatus = ContractGameStatus;
export type Game = ContractGame;
export type GameInfo = ContractGameInfo;

export const NETWORK = {
  name: 'Testnet',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  passphrase: 'Test SDF Network ; September 2015',
  contractId: 'CAFAPH7VQYLJZ3B4SGAJ47AD3ZOSM63CTQOUXT5XDQH3HWAKEONUO3GU',
};

export class TicTacToeContract {
  private client: TicTacToeClient;
  private walletManager: SafeWalletManager;

  constructor(walletManager: SafeWalletManager) {
    this.walletManager = walletManager;
    this.client = new TicTacToeClient({
      contractId: NETWORK.contractId,
      networkPassphrase: NETWORK.passphrase,
      rpcUrl: NETWORK.rpcUrl,
    });
  }

  // Helper function to ensure valid Symbol format
  private sanitizeSymbol(input: string): string {
    // Stellar Symbols can only contain alphanumeric characters and underscores
    // Maximum 32 characters
    return input
      .replace(/[^a-zA-Z0-9_]/g, '') // Remove invalid characters
      .slice(0, 32) // Limit to 32 characters
      .toLowerCase(); // Convert to lowercase for consistency
  }

  async createGame(playerName: string): Promise<number> {
    console.log('🎮 Creating game for player:', playerName);
    
    try {
      // Sanitize the player name to ensure it's a valid Symbol
      const sanitizedPlayerName = this.sanitizeSymbol(playerName);
      
      if (!sanitizedPlayerName) {
        throw new Error('Player name must contain at least one alphanumeric character');
      }
      
      // Get the public key from the connected wallet
      const publicKey = await this.walletManager.getPublicKey();
      console.log('🔑 Using account:', publicKey);
      
      const tx = await this.client.create_game({
        player_x: sanitizedPlayerName
      }, {
        fee: 100000,
      });
      
      const result = await tx.signAndSend({
        signTransaction: async (xdr) => {
          console.log('📝 Signing transaction with Freighter...');
          const signedXdr = await this.walletManager.signTransaction(xdr, NETWORK.passphrase);
          return {
            signedTxXdr: signedXdr,
            signerAddress: await this.walletManager.getPublicKey()
          };
        }
      });
      
      console.log('✅ Game created with ID:', result.result);
      return result.result;
    } catch (error) {
      console.error('❌ Failed to create game:', error);
      throw error;
    }
  }

  async joinGame(gameId: number, playerName: string): Promise<Game> {
    console.log('🚪 Joining game:', gameId, 'as player:', playerName);
    
    try {
      // Sanitize the player name
      const sanitizedPlayerName = this.sanitizeSymbol(playerName);
      
      if (!sanitizedPlayerName) {
        throw new Error('Player name must contain at least one alphanumeric character');
      }
      
      const tx = await this.client.join_game({
        game_id: gameId,
        player_o: sanitizedPlayerName
      }, {
        fee: 100000,
      });
      
      const result = await tx.signAndSend({
        signTransaction: async (xdr) => {
          console.log('📝 Signing transaction with Freighter...');
          const signedXdr = await this.walletManager.signTransaction(xdr, NETWORK.passphrase);
          return {
            signedTxXdr: signedXdr,
            signerAddress: await this.walletManager.getPublicKey()
          };
        }
      });
      
      console.log('✅ Game joined successfully:', result.result);
      return result.result;
    } catch (error) {
      console.error('❌ Failed to join game:', error);
      throw error;
    }
  }

  async makeMove(gameId: number, player: string, position: number): Promise<Game> {
    console.log('🎯 Making move:', { gameId, player, position });
    
    try {
      // Sanitize the player name
      const sanitizedPlayer = this.sanitizeSymbol(player);
      
      const tx = await this.client.make_move({
        game_id: gameId,
        player: sanitizedPlayer,
        position: position
      }, {
        fee: 100000,
      });
      
      const result = await tx.signAndSend({
        signTransaction: async (xdr) => {
          console.log('📝 Signing transaction with Freighter...');
          const signedXdr = await this.walletManager.signTransaction(xdr, NETWORK.passphrase);
          return {
            signedTxXdr: signedXdr,
            signerAddress: await this.walletManager.getPublicKey()
          };
        }
      });
      
      console.log('✅ Move made successfully:', result.result);
      return result.result;
    } catch (error) {
      console.error('❌ Failed to make move:', error);
      throw error;
    }
  }

  async getGame(gameId: number): Promise<Game> {
    console.log('📊 Getting game state for ID:', gameId);
    
    try {
      const tx = await this.client.get_game({
        game_id: gameId
      });
      
      const game = tx.result;
      console.log('✅ Game state retrieved:', game);
      return game;
    } catch (error) {
      console.error('❌ Failed to get game:', error);
      throw error;
    }
  }

  async getBoard(gameId: number): Promise<Array<Player | null | undefined>> {
    console.log('📋 Getting board for game ID:', gameId);
    
    try {
      const tx = await this.client.get_board({
        game_id: gameId
      });
      
      const board = tx.result;
      console.log('✅ Board retrieved:', board);
      return board;
    } catch (error) {
      console.error('❌ Failed to get board:', error);
      throw error;
    }
  }

  async getAvailableGames(): Promise<Array<GameInfo>> {
    console.log('📋 Getting available games from contract...');
    
    try {
      const tx = await this.client.list_games();
      const games = tx.result;
      
      console.log('✅ Games list retrieved:', games);
      return games;
    } catch (error) {
      console.error('❌ Failed to get games list:', error);
      throw error;
    }
  }
}