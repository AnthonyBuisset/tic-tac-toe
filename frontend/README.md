# Tic-Tac-Toe Frontend

A React frontend for the Stellar Tic-Tac-Toe smart contract that integrates with LOBSTR wallet.

## Features

- **LOBSTR Wallet Integration**: Connect using LOBSTR wallet on Stellar Testnet
- **Game Management**: Create new games and join existing ones
- **Real-time Updates**: Auto-refreshes game list every 10 seconds
- **Game Status Tracking**: See which games are waiting for players, in progress, or finished

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. The contract is already deployed to testnet with address:
   ```typescript
   const CONTRACT_ADDRESS = 'CAFAPH7VQYLJZ3B4SGAJ47AD3ZOSM63CTQOUXT5XDQH3HWAKEONUO3GU';
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Requirements

- LOBSTR Wallet browser extension installed and connected
- Extension configured for Testnet
- LOBSTR mobile app connected to the extension
- Stellar smart contract deployed on Testnet

## Usage

1. Make sure LOBSTR extension is installed and connected to your mobile app
2. Open the app and connect your LOBSTR wallet
3. View all available games in the list
4. Create a new game (you'll be Player X and wait for someone to join)
5. Join an existing game that's waiting for a second player
6. Games auto-refresh to show latest status

## LOBSTR Extension Setup

1. Install [LOBSTR Extension](https://chrome.google.com/webstore/detail/lobstr-signer-extension/ldiagbjmlmjiieclmdkagofdjcgodjle) from Chrome Web Store
2. Install LOBSTR mobile app and create/import your wallet
3. Connect the extension to your mobile app by scanning the QR code
4. Ensure your wallet is set to Testnet mode for development

## Architecture

- `App.tsx`: Main application component
- `components/WalletConnect.tsx`: Wallet connection interface
- `components/GamesList.tsx`: Games list and management
- `wallet.ts`: Stellar wallet and contract interaction service