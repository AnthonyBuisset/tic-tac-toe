import { getUserInfo, isAllowed, isConnected, setAllowed, signTransaction } from '@stellar/freighter-api';
import { Keypair } from '@stellar/stellar-sdk';

export interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  error: string | null;
}

export class WalletManager {
  async connect(): Promise<WalletState> {
    try {
      // Check if Freighter is installed
      const connected = await isConnected();
      if (!connected) {
        throw new Error('Freighter wallet not found. Please install Freighter extension.');
      }

      // Check if we have permission
      const allowed = await isAllowed();
      if (!allowed) {
        // Request permission
        await setAllowed();
      }

      // Get user info
      const userInfo = await getUserInfo();
      
      return {
        isConnected: true,
        publicKey: userInfo.publicKey,
        error: null,
      };
    } catch (error) {
      return {
        isConnected: false,
        publicKey: null,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      };
    }
  }

  async signTransaction(xdr: string, network: string): Promise<string> {
    try {
      const result = await signTransaction(xdr, {
        network,
        accountToSign: await this.getPublicKey(),
      });
      return result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to sign transaction');
    }
  }

  async getPublicKey(): Promise<string> {
    const userInfo = await getUserInfo();
    return userInfo.publicKey;
  }

  async isConnected(): Promise<boolean> {
    try {
      const connected = await isConnected();
      const allowed = await isAllowed();
      return connected && allowed;
    } catch {
      return false;
    }
  }

  // For development/testing - create a test keypair
  createTestKeypair(): Keypair {
    return Keypair.random();
  }

  // Get test accounts for local development
  getTestAccounts() {
    return {
      alice: Keypair.random(),
      bob: Keypair.random(),
    };
  }
}