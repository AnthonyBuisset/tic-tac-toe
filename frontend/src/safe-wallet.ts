import { Keypair } from '@stellar/stellar-sdk';

export interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  error: string | null;
}

export class SafeWalletManager {
  async connect(): Promise<WalletState> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment');
      }

      // Dynamically import Freighter API
      const freighter = await import('@stellar/freighter-api');
      
      // Check if Freighter is installed
      const connected = await freighter.isConnected();
      if (!connected) {
        throw new Error('Freighter wallet not found. Please install Freighter extension and refresh the page.');
      }

      // Check if we have permission
      const allowed = await freighter.isAllowed();
      if (!allowed) {
        // Request permission
        await freighter.setAllowed();
      }

      // Get user info
      const userInfo = await freighter.getUserInfo();
      
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
      const freighter = await import('@stellar/freighter-api');
      const result = await freighter.signTransaction(xdr, {
        network,
        accountToSign: await this.getPublicKey(),
      });
      return result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to sign transaction');
    }
  }

  async getPublicKey(): Promise<string> {
    const freighter = await import('@stellar/freighter-api');
    const userInfo = await freighter.getUserInfo();
    return userInfo.publicKey;
  }

  async isConnected(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        return false;
      }
      
      const freighter = await import('@stellar/freighter-api');
      const connected = await freighter.isConnected();
      const allowed = await freighter.isAllowed();
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

// Add global type for Freighter
declare global {
  interface Window {
    freighter?: any;
  }
}