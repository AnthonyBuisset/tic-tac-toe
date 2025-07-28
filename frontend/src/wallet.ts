import { getPublicKey, isConnected, signTransaction } from '@lobstrco/signer-extension-api';
import { Contract, nativeToScVal, Networks, rpc, scValToNative, TransactionBuilder, xdr } from '@stellar/stellar-sdk';

export interface WalletConnection {
  publicKey: string;
  network: string;
}

export interface GameInfo {
  id: number;
  player_x: string;
  player_o: string;
  status: 'InProgress' | 'XWins' | 'OWins' | 'Draw' | 'Claimed';
  has_bet: boolean;
  bet_amount: number;
  bet_token_native: boolean;
  bet_token_symbol: string;
}

export interface UserBalance {
  native: number;
  tokens: Array<{ symbol: string; balance: number }>;
}

export interface TokenType {
  native: boolean;
  symbol?: string;
}



const TESTNET_NETWORK_PASSPHRASE = Networks.TESTNET;
const TESTNET_RPC_URL = 'https://soroban-testnet.stellar.org';

// Contract address on Stellar Testnet
const CONTRACT_ADDRESS = 'CA755BAEZO2ULWPBCY2UEJAAYVQLW3A6JGMB57DB5A52UA7N4IBG25TG';

export class WalletService {
  private rpcServer: rpc.Server;
  private contract: Contract;

  constructor() {
    this.rpcServer = new rpc.Server(TESTNET_RPC_URL);
    this.contract = new Contract(CONTRACT_ADDRESS);
  }

  // Convert wallet address to a short symbol for the contract
  private addressToSymbol(address: string): string {
    // Create a short, deterministic identifier from the address
    const hash = address.slice(-8); // Last 8 characters
    return `p_${hash}`;
  }

  // Store address-to-symbol mapping for display purposes
  private symbolToAddress = new Map<string, string>();

  private registerAddressSymbol(address: string): string {
    const symbol = this.addressToSymbol(address);
    this.symbolToAddress.set(symbol, address);
    return symbol;
  }

  getPlayerSymbol(address: string): string {
    return this.addressToSymbol(address);
  }

  // === BALANCE MANAGEMENT ===

  async getBalance(wallet: WalletConnection): Promise<UserBalance> {
    console.log('📞 [CONTRACT CALL]', { method: 'get_balance', args: { user: this.getPlayerSymbol(wallet.publicKey) } });
    try {
      const account = await this.rpcServer.getAccount(wallet.publicKey);
      
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(this.contract.call('get_balance', xdr.ScVal.scvSymbol(this.getPlayerSymbol(wallet.publicKey))))
        .setTimeout(30)
        .build();

      const simulateResponse = await this.rpcServer.simulateTransaction(transaction);
      
      if ('error' in simulateResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'get_balance', error: simulateResponse.error });
        throw new Error(`Simulation error: ${simulateResponse.error}`);
      }

      if (!simulateResponse.result?.retval) {
        console.log('📞 [CONTRACT RESPONSE]', { method: 'get_balance', result: { native: 0, tokens: [] } });
        return { native: 0, tokens: [] };
      }

      const balanceData = scValToNative(simulateResponse.result.retval) as {
        native?: number;
        tokens?: Array<[string, number]>;
      };
      console.log('📞 [CONTRACT RESPONSE]', { method: 'get_balance', result: balanceData });
      
      const result = {
        native: balanceData.native || 0,
        tokens: (balanceData.tokens || []).map((token) => ({
          symbol: token[0],
          balance: token[1]
        }))
      };
      
      return result;
    } catch (error: unknown) {
      console.log('📞 [CONTRACT ERROR]', { method: 'get_balance', error: error });
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  async depositNative(wallet: WalletConnection, amount: number): Promise<void> {
    const playerSymbol = this.getPlayerSymbol(wallet.publicKey);
    console.log('📞 [CONTRACT CALL]', { method: 'deposit_native', args: { user: playerSymbol, amount } });
    
    try {
      if (!isConnected()) {
        throw new Error('LOBSTR Wallet not connected');
      }

      const sourceAccount = await this.rpcServer.getAccount(wallet.publicKey);
      
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '1000000',
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(
          this.contract.call(
            'deposit_native',
            xdr.ScVal.scvSymbol(playerSymbol),
            nativeToScVal(amount, { type: 'i128' })
          )
        )
        .setTimeout(300)
        .build();

      const simulateResponse = await this.rpcServer.simulateTransaction(transaction);
      
      if ('error' in simulateResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'deposit_native', args: { user: playerSymbol, amount }, error: simulateResponse.error });
        throw new Error(`Simulation error: ${simulateResponse.error}`);
      }

      const signedTransactionXdr = await signTransaction(transaction.toXDR());
      const signedTransaction = TransactionBuilder.fromXDR(signedTransactionXdr, TESTNET_NETWORK_PASSPHRASE);
      
      const transactionResponse = await this.rpcServer.sendTransaction(signedTransaction);
      
      if ('errorResult' in transactionResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'deposit_native', args: { user: playerSymbol, amount }, error: transactionResponse.errorResult });
        throw new Error(`Transaction failed: ${transactionResponse.errorResult}`);
      }

      // Wait for confirmation
      const hash = transactionResponse.hash;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await this.rpcServer.getTransaction(hash);
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
          console.log('📞 [CONTRACT RESPONSE]', { method: 'deposit_native', args: { user: playerSymbol, amount }, result: 'success' });
          return;
        }
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
          console.log('📞 [CONTRACT ERROR]', { method: 'deposit_native', args: { user: playerSymbol, amount }, error: 'Transaction failed on network' });
          throw new Error('Transaction failed');
        }
        
        attempts++;
      }

      console.log('📞 [CONTRACT ERROR]', { method: 'deposit_native', args: { user: playerSymbol, amount }, error: 'Transaction timeout' });
      throw new Error('Transaction timeout');
    } catch (error: unknown) {
      console.error('Failed to deposit native:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  async withdrawNative(wallet: WalletConnection, amount: number): Promise<void> {
    const playerSymbol = this.getPlayerSymbol(wallet.publicKey);
    console.log('📞 [CONTRACT CALL]', { method: 'withdraw_native', args: { user: playerSymbol, amount } });
    
    try {
      if (!isConnected()) {
        throw new Error('LOBSTR Wallet not connected');
      }

      const sourceAccount = await this.rpcServer.getAccount(wallet.publicKey);
      
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '1000000',
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(
          this.contract.call(
            'withdraw_native',
            xdr.ScVal.scvSymbol(playerSymbol),
            nativeToScVal(amount, { type: 'i128' })
          )
        )
        .setTimeout(300)
        .build();

      const simulateResponse = await this.rpcServer.simulateTransaction(transaction);
      
      if ('error' in simulateResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'withdraw_native', args: { user: playerSymbol, amount }, error: simulateResponse.error });
        throw new Error(`Simulation error: ${simulateResponse.error}`);
      }

      const signedTransactionXdr = await signTransaction(transaction.toXDR());
      const signedTransaction = TransactionBuilder.fromXDR(signedTransactionXdr, TESTNET_NETWORK_PASSPHRASE);
      
      const transactionResponse = await this.rpcServer.sendTransaction(signedTransaction);
      
      if ('errorResult' in transactionResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'withdraw_native', args: { user: playerSymbol, amount }, error: transactionResponse.errorResult });
        throw new Error(`Transaction failed: ${transactionResponse.errorResult}`);
      }

      // Wait for confirmation
      const hash = transactionResponse.hash;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await this.rpcServer.getTransaction(hash);
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
          console.log('📞 [CONTRACT RESPONSE]', { method: 'withdraw_native', args: { user: playerSymbol, amount }, result: 'success' });
          return;
        }
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
          console.log('📞 [CONTRACT ERROR]', { method: 'withdraw_native', args: { user: playerSymbol, amount }, error: 'Transaction failed on network' });
          throw new Error('Transaction failed');
        }
        
        attempts++;
      }

      console.log('📞 [CONTRACT ERROR]', { method: 'withdraw_native', args: { user: playerSymbol, amount }, error: 'Transaction timeout' });
      throw new Error('Transaction timeout');
    } catch (error: unknown) {
      console.error('Failed to withdraw native:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  async depositToken(wallet: WalletConnection, tokenAddress: string, amount: number): Promise<void> {
    const playerSymbol = this.getPlayerSymbol(wallet.publicKey);
    console.log('📞 [CONTRACT CALL]', { method: 'deposit_token', args: { user: playerSymbol, token_address: tokenAddress, amount } });
    
    try {
      if (!isConnected()) {
        throw new Error('LOBSTR Wallet not connected');
      }

      const sourceAccount = await this.rpcServer.getAccount(wallet.publicKey);
      
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '1000000',
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(
          this.contract.call(
            'deposit_token',
            xdr.ScVal.scvSymbol(playerSymbol),
            xdr.ScVal.scvSymbol(tokenAddress),
            nativeToScVal(amount, { type: 'i128' })
          )
        )
        .setTimeout(300)
        .build();

      const simulateResponse = await this.rpcServer.simulateTransaction(transaction);
      
      if ('error' in simulateResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'deposit_token', args: { user: playerSymbol, token_address: tokenAddress, amount }, error: simulateResponse.error });
        throw new Error(`Simulation error: ${simulateResponse.error}`);
      }

      const signedTransactionXdr = await signTransaction(transaction.toXDR());
      const signedTransaction = TransactionBuilder.fromXDR(signedTransactionXdr, TESTNET_NETWORK_PASSPHRASE);
      
      const transactionResponse = await this.rpcServer.sendTransaction(signedTransaction);
      
      if ('errorResult' in transactionResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'deposit_token', args: { user: playerSymbol, token_address: tokenAddress, amount }, error: transactionResponse.errorResult });
        throw new Error(`Transaction failed: ${transactionResponse.errorResult}`);
      }

      // Wait for confirmation
      const hash = transactionResponse.hash;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await this.rpcServer.getTransaction(hash);
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
          console.log('📞 [CONTRACT RESPONSE]', { method: 'deposit_token', args: { user: playerSymbol, token_address: tokenAddress, amount }, result: 'success' });
          return;
        }
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
          console.log('📞 [CONTRACT ERROR]', { method: 'deposit_token', args: { user: playerSymbol, token_address: tokenAddress, amount }, error: 'Transaction failed on network' });
          throw new Error('Transaction failed');
        }
        
        attempts++;
      }

      console.log('📞 [CONTRACT ERROR]', { method: 'deposit_token', args: { user: playerSymbol, token_address: tokenAddress, amount }, error: 'Transaction timeout' });
      throw new Error('Transaction timeout');
    } catch (error: unknown) {
      console.error('Failed to deposit token:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  async withdrawToken(wallet: WalletConnection, tokenAddress: string, amount: number): Promise<void> {
    const playerSymbol = this.getPlayerSymbol(wallet.publicKey);
    console.log('📞 [CONTRACT CALL]', { method: 'withdraw_token', args: { user: playerSymbol, token_address: tokenAddress, amount } });
    
    try {
      if (!isConnected()) {
        throw new Error('LOBSTR Wallet not connected');
      }

      const sourceAccount = await this.rpcServer.getAccount(wallet.publicKey);
      
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '1000000',
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(
          this.contract.call(
            'withdraw_token',
            xdr.ScVal.scvSymbol(playerSymbol),
            xdr.ScVal.scvSymbol(tokenAddress),
            nativeToScVal(amount, { type: 'i128' })
          )
        )
        .setTimeout(300)
        .build();

      const simulateResponse = await this.rpcServer.simulateTransaction(transaction);
      
      if ('error' in simulateResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'withdraw_token', args: { user: playerSymbol, token_address: tokenAddress, amount }, error: simulateResponse.error });
        throw new Error(`Simulation error: ${simulateResponse.error}`);
      }

      const signedTransactionXdr = await signTransaction(transaction.toXDR());
      const signedTransaction = TransactionBuilder.fromXDR(signedTransactionXdr, TESTNET_NETWORK_PASSPHRASE);
      
      const transactionResponse = await this.rpcServer.sendTransaction(signedTransaction);
      
      if ('errorResult' in transactionResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'withdraw_token', args: { user: playerSymbol, token_address: tokenAddress, amount }, error: transactionResponse.errorResult });
        throw new Error(`Transaction failed: ${transactionResponse.errorResult}`);
      }

      // Wait for confirmation
      const hash = transactionResponse.hash;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await this.rpcServer.getTransaction(hash);
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
          console.log('📞 [CONTRACT RESPONSE]', { method: 'withdraw_token', args: { user: playerSymbol, token_address: tokenAddress, amount }, result: 'success' });
          return;
        }
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
          console.log('📞 [CONTRACT ERROR]', { method: 'withdraw_token', args: { user: playerSymbol, token_address: tokenAddress, amount }, error: 'Transaction failed on network' });
          throw new Error('Transaction failed');
        }
        
        attempts++;
      }

      console.log('📞 [CONTRACT ERROR]', { method: 'withdraw_token', args: { user: playerSymbol, token_address: tokenAddress, amount }, error: 'Transaction timeout' });
      throw new Error('Transaction timeout');
    } catch (error: unknown) {
      console.error('Failed to withdraw token:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  // === BETTING GAMES ===

  async createGameWithBet(wallet: WalletConnection, betAmount: number, tokenType: TokenType): Promise<number> {
    const playerSymbol = this.getPlayerSymbol(wallet.publicKey);
    const tokenTypeParam = tokenType.native ? 
      nativeToScVal({ Native: null }, { type: 'instance' }) :
      nativeToScVal({ Stellar: tokenType.symbol }, { type: 'instance' });
    
    console.log('📞 [CONTRACT CALL]', { method: 'create_game_with_bet', args: { player_x: playerSymbol, bet_amount: betAmount, token_type: tokenType } });
    
    try {
      if (!isConnected()) {
        throw new Error('LOBSTR Wallet not connected');
      }

      const sourceAccount = await this.rpcServer.getAccount(wallet.publicKey);
      
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '1000000',
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(
          this.contract.call(
            'create_game_with_bet',
            xdr.ScVal.scvSymbol(playerSymbol),
            nativeToScVal(betAmount, { type: 'i128' }),
            tokenTypeParam
          )
        )
        .setTimeout(300)
        .build();

      const simulateResponse = await this.rpcServer.simulateTransaction(transaction);
      
      if ('error' in simulateResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'create_game_with_bet', args: { player_x: playerSymbol, bet_amount: betAmount, token_type: tokenType }, error: simulateResponse.error });
        throw new Error(`Simulation error: ${simulateResponse.error}`);
      }

      const signedTransactionXdr = await signTransaction(transaction.toXDR());
      const signedTransaction = TransactionBuilder.fromXDR(signedTransactionXdr, TESTNET_NETWORK_PASSPHRASE);
      
      const transactionResponse = await this.rpcServer.sendTransaction(signedTransaction);
      
      if ('errorResult' in transactionResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'create_game_with_bet', args: { player_x: playerSymbol, bet_amount: betAmount, token_type: tokenType }, error: transactionResponse.errorResult });
        throw new Error(`Transaction failed: ${transactionResponse.errorResult}`);
      }

      // Wait for confirmation and get game ID
      const hash = transactionResponse.hash;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await this.rpcServer.getTransaction(hash);
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
          if ('returnValue' in statusResponse && statusResponse.returnValue) {
            const gameId = scValToNative(statusResponse.returnValue) as number;
            console.log('📞 [CONTRACT RESPONSE]', { method: 'create_game_with_bet', args: { player_x: playerSymbol, bet_amount: betAmount, token_type: tokenType }, result: { game_id: gameId } });
            return gameId;
          }
          throw new Error('Failed to get game ID from transaction result');
        }
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
          console.log('📞 [CONTRACT ERROR]', { method: 'create_game_with_bet', args: { player_x: playerSymbol, bet_amount: betAmount, token_type: tokenType }, error: 'Transaction failed on network' });
          throw new Error('Transaction failed');
        }
        
        attempts++;
      }

      console.log('📞 [CONTRACT ERROR]', { method: 'create_game_with_bet', args: { player_x: playerSymbol, bet_amount: betAmount, token_type: tokenType }, error: 'Transaction timeout' });
      throw new Error('Transaction timeout');
    } catch (error: unknown) {
      console.error('Failed to create game with bet:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  async claimRewards(wallet: WalletConnection, gameId: number): Promise<void> {
    const playerSymbol = this.getPlayerSymbol(wallet.publicKey);
    console.log('📞 [CONTRACT CALL]', { method: 'claim_rewards', args: { game_id: gameId, player: playerSymbol } });
    
    try {
      if (!isConnected()) {
        throw new Error('LOBSTR Wallet not connected');
      }

      const sourceAccount = await this.rpcServer.getAccount(wallet.publicKey);
      
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '1000000',
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(
          this.contract.call(
            'claim_rewards',
            nativeToScVal(gameId, { type: 'u32' }),
            xdr.ScVal.scvSymbol(playerSymbol)
          )
        )
        .setTimeout(300)
        .build();

      const simulateResponse = await this.rpcServer.simulateTransaction(transaction);
      
      if ('error' in simulateResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'claim_rewards', args: { game_id: gameId, player: playerSymbol }, error: simulateResponse.error });
        throw new Error(`Simulation error: ${simulateResponse.error}`);
      }

      const signedTransactionXdr = await signTransaction(transaction.toXDR());
      const signedTransaction = TransactionBuilder.fromXDR(signedTransactionXdr, TESTNET_NETWORK_PASSPHRASE);
      
      const transactionResponse = await this.rpcServer.sendTransaction(signedTransaction);
      
      if ('errorResult' in transactionResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'claim_rewards', args: { game_id: gameId, player: playerSymbol }, error: transactionResponse.errorResult });
        throw new Error(`Transaction failed: ${transactionResponse.errorResult}`);
      }

      // Wait for confirmation
      const hash = transactionResponse.hash;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await this.rpcServer.getTransaction(hash);
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
          console.log('📞 [CONTRACT RESPONSE]', { method: 'claim_rewards', args: { game_id: gameId, player: playerSymbol }, result: 'success' });
          return;
        }
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
          console.log('📞 [CONTRACT ERROR]', { method: 'claim_rewards', args: { game_id: gameId, player: playerSymbol }, error: 'Transaction failed on network' });
          throw new Error('Transaction failed');
        }
        
        attempts++;
      }

      console.log('📞 [CONTRACT ERROR]', { method: 'claim_rewards', args: { game_id: gameId, player: playerSymbol }, error: 'Transaction timeout' });
      throw new Error('Transaction timeout');
    } catch (error: unknown) {
      console.error('Failed to claim rewards:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  async connectLobstrWallet(): Promise<WalletConnection | null> {
    try {
      // Check if LOBSTR extension is available and connected
      if (!isConnected()) {
        throw new Error('LOBSTR Wallet extension not found or not connected. Please install it and connect first.');
      }

      const publicKey = await getPublicKey();
      
      if (publicKey) {
        return {
          publicKey,
          network: 'testnet'
        };
      }
      
      return null;
    } catch (error: unknown) {
      console.error('Failed to connect LOBSTR wallet:', error);
      throw new Error((error as Error).message || 'Failed to connect to LOBSTR wallet');
    }
  }

  async listGames(wallet: WalletConnection): Promise<GameInfo[]> {
    console.log('📞 [CONTRACT CALL]', { method: 'list_games', args: [] });
    try {
      const account = await this.rpcServer.getAccount(wallet.publicKey);
      
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(this.contract.call('list_games'))
        .setTimeout(30)
        .build();

      const simulateResponse = await this.rpcServer.simulateTransaction(transaction);
      
      if ('error' in simulateResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'list_games', error: simulateResponse.error });
        throw new Error(`Simulation error: ${simulateResponse.error}`);
      }

      if (!simulateResponse.result?.retval) {
        console.log('📞 [CONTRACT RESPONSE]', { method: 'list_games', result: [] });
        return [];
      }

      const games = scValToNative(simulateResponse.result.retval) as Array<{
        id: number;
        player_x: string;
        player_o: string;
        status: string;
        has_bet?: boolean;
        bet_amount?: number;
        bet_token_native?: boolean;
        bet_token_symbol?: string;
      }>;
      console.log('📞 [CONTRACT RESPONSE]', { method: 'list_games', result: games });
      
      return games.map((game) => ({
        id: game.id,
        player_x: game.player_x,
        player_o: game.player_o,
        status: game.status as GameInfo['status'],
        has_bet: game.has_bet || false,
        bet_amount: game.bet_amount || 0,
        bet_token_native: game.bet_token_native || true,
        bet_token_symbol: game.bet_token_symbol || 'XLM'
      }));
    } catch (error: unknown) {
      console.log('📞 [CONTRACT ERROR]', { method: 'list_games', error: error });
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  async createGame(wallet: WalletConnection): Promise<number> {
    const playerSymbol = this.registerAddressSymbol(wallet.publicKey);
    console.log('📞 [CONTRACT CALL]', { method: 'create_game', args: { player_x: playerSymbol } });
    
    try {
      if (!isConnected()) {
        throw new Error('LOBSTR Wallet not connected');
      }

      const sourceAccount = await this.rpcServer.getAccount(wallet.publicKey);
      
      // Build the transaction with proper settings for Soroban
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '1000000', // Higher fee for Soroban operations
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(
          this.contract.call(
            'create_game',
            xdr.ScVal.scvSymbol(playerSymbol)
          )
        )
        .setTimeout(300) // Longer timeout for Soroban
        .build();

      // First simulate the transaction to get proper fee and resource requirements
      const simulateResponse = await this.rpcServer.simulateTransaction(transaction);
      
      if ('error' in simulateResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'create_game', args: { player_x: playerSymbol }, error: simulateResponse.error });
        throw new Error(`Simulation error: ${simulateResponse.error}`);
      }

      // Sign the original transaction
      const signedTransactionXdr = await signTransaction(transaction.toXDR());
      const signedTransaction = TransactionBuilder.fromXDR(signedTransactionXdr, TESTNET_NETWORK_PASSPHRASE);
      
      const transactionResponse = await this.rpcServer.sendTransaction(signedTransaction);
      
      if ('errorResult' in transactionResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'create_game', args: { player_x: playerSymbol }, error: transactionResponse.errorResult });
        throw new Error(`Transaction failed: ${transactionResponse.errorResult}`);
      }

      // Wait for transaction to be included
      const hash = transactionResponse.hash;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await this.rpcServer.getTransaction(hash);
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
          // Extract game ID from transaction result
          if ('returnValue' in statusResponse && statusResponse.returnValue) {
            const gameId = scValToNative(statusResponse.returnValue) as number;
            console.log('📞 [CONTRACT RESPONSE]', { method: 'create_game', args: { player_x: playerSymbol }, result: { game_id: gameId } });
            return gameId;
          }
          console.log('📞 [CONTRACT ERROR]', { method: 'create_game', args: { player_x: playerSymbol }, error: 'No return value found' });
          throw new Error('Failed to get game ID from transaction result');
        }
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
          console.log('📞 [CONTRACT ERROR]', { method: 'create_game', args: { player_x: playerSymbol }, error: 'Transaction failed on network' });
          throw new Error('Transaction failed');
        }
        
        attempts++;
      }

      console.log('📞 [CONTRACT ERROR]', { method: 'create_game', args: { player_x: playerSymbol }, error: 'Transaction timeout' });
      throw new Error('Transaction timeout');
    } catch (error: unknown) {
      console.error('Failed to create game:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  async joinGame(wallet: WalletConnection, gameId: number): Promise<void> {
    const playerSymbol = this.registerAddressSymbol(wallet.publicKey);
    console.log('📞 [CONTRACT CALL]', { method: 'join_game', args: { game_id: gameId, player_o: playerSymbol } });
    
    try {
      if (!isConnected()) {
        throw new Error('LOBSTR Wallet not connected');
      }

      const sourceAccount = await this.rpcServer.getAccount(wallet.publicKey);
      
      // Build the transaction with proper settings for Soroban
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '1000000', // Higher fee for Soroban operations
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(
          this.contract.call(
            'join_game',
            nativeToScVal(gameId, { type: 'u32' }),
            xdr.ScVal.scvSymbol(playerSymbol)
          )
        )
        .setTimeout(300) // Longer timeout for Soroban
        .build();

      // First simulate the transaction
      const simulateResponse = await this.rpcServer.simulateTransaction(transaction);
      
      if ('error' in simulateResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'join_game', args: { game_id: gameId, player_o: playerSymbol }, error: simulateResponse.error });
        throw new Error(`Simulation error: ${simulateResponse.error}`);
      }

      // Sign the original transaction
      const signedTransactionXdr = await signTransaction(transaction.toXDR());
      const signedTransaction = TransactionBuilder.fromXDR(signedTransactionXdr, TESTNET_NETWORK_PASSPHRASE);
      
      const transactionResponse = await this.rpcServer.sendTransaction(signedTransaction);
      
      if ('errorResult' in transactionResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'join_game', args: { game_id: gameId, player_o: playerSymbol }, error: transactionResponse.errorResult });
        throw new Error(`Transaction failed: ${transactionResponse.errorResult}`);
      }

      // Wait for transaction to be included
      const hash = transactionResponse.hash;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await this.rpcServer.getTransaction(hash);
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
          console.log('📞 [CONTRACT RESPONSE]', { method: 'join_game', args: { game_id: gameId, player_o: playerSymbol }, result: 'success' });
          return;
        }
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
          console.log('📞 [CONTRACT ERROR]', { method: 'join_game', args: { game_id: gameId, player_o: playerSymbol }, error: 'Transaction failed on network' });
          throw new Error('Transaction failed');
        }
        
        attempts++;
      }

      console.log('📞 [CONTRACT ERROR]', { method: 'join_game', args: { game_id: gameId, player_o: playerSymbol }, error: 'Transaction timeout' });
      throw new Error('Transaction timeout');
    } catch (error: unknown) {
      console.error('Failed to join game:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  async getGame(wallet: WalletConnection, gameId: number): Promise<{
    id: number;
    board: Array<'X' | 'O' | null>;
    current_player: 'X' | 'O';
    player_x: string;
    player_o: string;
    status: 'InProgress' | 'XWins' | 'OWins' | 'Draw';
  }> {
    console.log('📞 [CONTRACT CALL]', { method: 'get_game', args: { game_id: gameId } });
    try {
      const account = await this.rpcServer.getAccount(wallet.publicKey);
      
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(this.contract.call('get_game', nativeToScVal(gameId, { type: 'u32' })))
        .setTimeout(30)
        .build();

      const simulateResponse = await this.rpcServer.simulateTransaction(transaction);
      
      if ('error' in simulateResponse) {
        console.log('📞 [CONTRACT ERROR]', { method: 'get_game', args: { game_id: gameId }, error: simulateResponse.error });
        throw new Error(`Simulation error: ${simulateResponse.error}`);
      }

      if (!simulateResponse.result?.retval) {
        console.log('📞 [CONTRACT ERROR]', { method: 'get_game', args: { game_id: gameId }, error: 'No game data returned' });
        throw new Error('No game data returned');
      }

      const gameData = scValToNative(simulateResponse.result.retval);
      
      const result = {
        id: gameId,
        board: gameData.board,
        current_player: gameData.current_player,
        player_x: gameData.player_x,
        player_o: gameData.player_o,
        status: gameData.status
      };
      
      console.log('📞 [CONTRACT RESPONSE]', { method: 'get_game', args: { game_id: gameId }, result });
      return result;
    } catch (error: unknown) {
      console.log('📞 [CONTRACT ERROR]', { method: 'get_game', args: { game_id: gameId }, error: error });
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  async makeMove(wallet: WalletConnection, gameId: number, position: number): Promise<void> {
    try {
      if (!isConnected()) {
        throw new Error('LOBSTR Wallet not connected');
      }

      const sourceAccount = await this.rpcServer.getAccount(wallet.publicKey);
      
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '1000000',
        networkPassphrase: TESTNET_NETWORK_PASSPHRASE,
      })
        .addOperation(
          this.contract.call(
            'make_move',
            nativeToScVal(gameId),
            xdr.ScVal.scvSymbol(this.registerAddressSymbol(wallet.publicKey)),
            nativeToScVal(position)
          )
        )
        .setTimeout(300)
        .build();

      // First simulate the transaction
      const simulateResponse = await this.rpcServer.simulateTransaction(transaction);
      
      if ('error' in simulateResponse) {
        throw new Error(`Simulation error: ${simulateResponse.error}`);
      }

      // Sign the original transaction
      const signedTransactionXdr = await signTransaction(transaction.toXDR());
      const signedTransaction = TransactionBuilder.fromXDR(signedTransactionXdr, TESTNET_NETWORK_PASSPHRASE);
      
      const transactionResponse = await this.rpcServer.sendTransaction(signedTransaction);
      
      if ('errorResult' in transactionResponse) {
        throw new Error(`Transaction failed: ${transactionResponse.errorResult}`);
      }

      // Wait for transaction to be included
      const hash = transactionResponse.hash;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await this.rpcServer.getTransaction(hash);
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
          return;
        }
        
        if (statusResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
          throw new Error('Transaction failed');
        }
        
        attempts++;
      }

      throw new Error('Transaction timeout');
    } catch (error: unknown) {
      console.error('Failed to make move:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }
}

