# 🎮 Tic-Tac-Toe Smart Contract

A fully-featured Tic-Tac-Toe game implemented as a Stellar smart contract using Soroban. This project demonstrates complete smart contract development, testing, deployment, and interaction workflows.

## ✨ Features

- **Complete Game Logic**: Full Tic-Tac-Toe implementation with win detection, draw handling, and turn management
- **Multiple Games**: Support for multiple concurrent games with unique game IDs
- **Persistent Storage**: Game state persisted on the blockchain
- **Comprehensive Testing**: 100% test coverage with unit and integration tests
- **Easy Deployment**: Automated deployment scripts for localnet
- **Interactive Scripts**: Command-line tools for game interaction
- **CI/CD Pipeline**: Automated testing and release workflows

## 🏗️ Project Structure

```text
.
├── contracts/
│   └── tic-tac-toe/
│       ├── src/
│       │   ├── lib.rs          # Smart contract implementation
│       │   └── test.rs         # Unit tests
│       └── Cargo.toml
├── tests/
│   ├── src/lib.rs
│   ├── tests/
│   │   └── integration_tests.rs # Integration tests
│   └── Cargo.toml
├── scripts/
│   ├── setup-localnet.sh       # Set up local Stellar network
│   ├── deploy.sh               # Deploy contract to localnet
│   └── interact.sh             # Interactive game script
├── .github/workflows/
│   ├── ci.yml                  # CI pipeline
│   └── release.yml             # Release pipeline
├── Makefile                    # Build and deployment commands
├── Cargo.toml                  # Workspace configuration
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd tic-tac-toe
```

### 2. Set Up Local Network

```bash
# Set up localnet with test accounts
make setup-localnet
# or
./scripts/setup-localnet.sh
```

### 3. Build and Deploy

```bash
# Build, test, and deploy
make deploy
# or manually:
make build
./scripts/deploy.sh
```

### 4. Play the Game

```bash
# Create a new game
make create-game

# Make moves (positions 0-8, left-to-right, top-to-bottom)
./scripts/interact.sh move alice 0  # X plays top-left
./scripts/interact.sh move bob 4    # O plays center

# Check game status
make game-status
make game-board
```

## 🎯 Game Rules

- **Board Layout**: 3x3 grid with positions 0-8:
  ```
  0 | 1 | 2
  ---------
  3 | 4 | 5
  ---------
  6 | 7 | 8
  ```
- **Players**: Two players (X and O) take turns
- **Winning**: First to get 3 in a row (horizontal, vertical, or diagonal)
- **Draw**: Game ends in draw if board is full with no winner

## 🔧 Development

### Running Tests

```bash
# Unit tests
make test
cargo test -p tic-tac-toe

# Integration tests
make integration
cargo test -p tic-tac-toe-integration-tests

# All tests
cargo test --all
```

### Building

```bash
# Build for development
cargo build

# Build optimized WASM
make build
```

### Code Quality

```bash
# Format code
cargo fmt

# Lint code
cargo clippy
```

## 📋 Available Commands

### Makefile Commands

- `make help` - Show all available commands
- `make build` - Build the smart contract
- `make test` - Run unit tests
- `make setup-localnet` - Set up local Stellar network
- `make deploy` - Deploy contract to localnet
- `make create-game` - Create a new game
- `make game-status` - Show current game status
- `make game-board` - Show current board state
- `make integration` - Run integration tests
- `make verify` - Verify complete setup
- `make clean` - Clean build artifacts

### Script Commands

```bash
# Setup and deployment
./scripts/setup-localnet.sh
./scripts/deploy.sh

# Game interaction
./scripts/interact.sh create
./scripts/interact.sh move <player> <position>
./scripts/interact.sh status
./scripts/interact.sh board
./scripts/interact.sh help
```

## 🔌 Smart Contract API

### Methods

#### `create_game(player_x: Symbol, player_o: Symbol) -> u32`
Creates a new game between two players and returns the game ID.

#### `make_move(game_id: u32, player: Symbol, position: u32) -> Game`
Makes a move in the specified game. Returns updated game state.

#### `get_game(game_id: u32) -> Game`
Returns the complete game state for the specified game ID.

#### `get_board(game_id: u32) -> Vec<Option<Player>>`
Returns just the board state for the specified game ID.

### Data Types

```rust
pub enum Player { X, O }

pub enum GameStatus { 
    InProgress, 
    XWins, 
    OWins, 
    Draw 
}

pub struct Game {
    pub board: Vec<Option<Player>>,
    pub current_player: Player,
    pub player_x: Symbol,
    pub player_o: Symbol,
    pub status: GameStatus,
}
```

## 🧪 Testing

The project includes comprehensive test coverage:

### Unit Tests (11 tests)
- Game creation and initialization
- Move validation and execution
- Win condition detection
- Error handling (invalid moves, wrong turns, etc.)
- Multiple concurrent games

### Integration Tests (4 tests)
- Complete game workflow
- Multiple concurrent games
- Game state persistence
- Comprehensive winning conditions

### Test Coverage
- **Game Logic**: 100% coverage of all game rules
- **Error Cases**: All error conditions tested
- **Edge Cases**: Boundary conditions and invalid inputs
- **Persistence**: Storage and retrieval functionality

## 🚦 CI/CD Pipeline

The project includes automated workflows:

### CI Pipeline (`.github/workflows/ci.yml`)
- Runs on every push and PR
- Executes all tests (unit + integration)
- Builds optimized contract
- Checks code formatting and linting
- Validates deployment scripts

### Release Pipeline (`.github/workflows/release.yml`)
- Triggers on version tags (`v*`)
- Creates optimized build
- Generates release artifacts
- Publishes GitHub release with binaries

## 🔐 Security Considerations

- **Input Validation**: All inputs are validated for bounds and correctness
- **State Management**: Game state is properly isolated between games
- **Access Control**: Only current player can make moves
- **Panic Safety**: Contract uses proper error handling with descriptive messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙋‍♂️ Support

For questions or issues:
1. Check the existing GitHub issues
2. Create a new issue with detailed description
3. Provide steps to reproduce any bugs

## 🎉 Acknowledgments

Built with:
- [Stellar](https://stellar.org/) - Blockchain platform
- [Soroban](https://soroban.stellar.org/) - Smart contract platform
- [Rust](https://www.rust-lang.org/) - Programming language