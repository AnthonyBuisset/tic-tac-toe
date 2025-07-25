# 🎮 Stellar Tic-Tac-Toe Frontend

A React frontend for the Stellar Tic-Tac-Toe smart contract game.

## ✨ Features

- **Network Selection**: Choose between Local, Testnet, and Mainnet
- **Wallet Integration**: Connect with Freighter wallet (or use test accounts for development)
- **Game Creation**: Start new games with custom player names
- **Game Joining**: Join existing games by ID
- **Interactive Board**: Click to make moves with real-time updates
- **Game Status**: Live win/draw detection and game state display

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Stellar localnet running (for local development)
- Freighter wallet extension (for production use)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## 🎯 How to Play

### For Local Development

1. **Start the frontend**: `npm run dev`
2. **Enable test accounts**: Check "Use test accounts" for simplified development
3. **Create a game**: Enter player names and click "Create Game"
4. **Make moves**: Click on board cells to play
5. **Join games**: Use the Game ID to join existing games

### For Production Use

1. **Install Freighter**: Add the Freighter wallet extension to your browser
2. **Connect wallet**: Click "Connect Freighter Wallet"
3. **Select network**: Choose Testnet or Mainnet
4. **Play games**: Create or join games using your wallet

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint the code

### Project Structure

```
src/
├── App.tsx              # Main application component
├── contracts.ts         # Real contract integration (advanced)
├── simple-contracts.ts  # Simplified contract simulation
├── wallet.ts           # Freighter wallet integration
├── index.css           # Styling
└── main.tsx            # Application entry point
```

## 🌐 Network Configuration

The frontend supports multiple Stellar networks:

- **Local**: `http://localhost:8000/soroban/rpc` (for development)
- **Testnet**: `https://soroban-testnet.stellar.org` (for testing)
- **Mainnet**: `https://soroban-mainnet.stellar.org` (for production)

## 🔌 Smart Contract Integration

The frontend includes two integration approaches:

### 1. Simple Contract (Development)
- Simulates contract behavior locally
- No blockchain interaction required
- Perfect for UI development and testing

### 2. Real Contract (Production)
- Connects to actual deployed contracts
- Uses Stellar SDK for blockchain interaction
- Requires wallet connection and network fees

## 🎨 UI Components

### Game Board
- 3x3 grid with clickable cells
- Visual feedback for moves
- Disabled state for completed games

### Wallet Connection
- Freighter wallet integration
- Connection status display
- Network selection dropdown

### Game Controls
- Create new game form
- Join existing game by ID
- Game status and information display

## 📱 Responsive Design

The frontend is designed to work on:
- Desktop browsers
- Mobile devices
- Tablets

## 🔐 Security

- No private keys stored in frontend
- All transactions signed through Freighter wallet
- Input validation for game moves
- Network configuration validation

## 🐛 Troubleshooting

### Common Issues

**Wallet won't connect**
- Ensure Freighter extension is installed
- Check if wallet is unlocked
- Verify network selection

**Game moves fail**
- Check if it's your turn
- Verify position isn't already taken
- Ensure game is still in progress

**Contract errors**
- Verify localnet is running (for local development)
- Check contract deployment status
- Confirm network configuration

### Development Mode

For local development, enable "Use test accounts" to bypass wallet requirements and use predefined test accounts.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the Stellar Tic-Tac-Toe smart contract project and is available under the MIT License.