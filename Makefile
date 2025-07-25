.PHONY: build test deploy setup-localnet interact clean help

# Default target
help:
	@echo "🎮 Tic-Tac-Toe Smart Contract - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make build           Build the smart contract"
	@echo "  make test            Run unit tests"
	@echo "  make clean           Clean build artifacts"
	@echo ""
	@echo "Deployment:"
	@echo "  make setup-localnet  Set up localnet with test accounts"
	@echo "  make deploy          Deploy contract to localnet"
	@echo ""
	@echo "Interaction:"
	@echo "  make create-game     Create a new game"
	@echo "  make game-status     Show current game status"
	@echo "  make game-board      Show current board"
	@echo ""
	@echo "Testing:"
	@echo "  make integration     Run integration tests"
	@echo "  make verify          Verify complete setup"
	@echo ""

# Build the contract
build:
	@echo "📦 Building Tic-Tac-Toe contract..."
	@stellar contract build

# Run unit tests
test:
	@echo "🧪 Running unit tests..."
	@cd contracts/tic-tac-toe && cargo test

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@cd contracts/tic-tac-toe && cargo clean
	@rm -f .contract-id .game-id

# Set up localnet
setup-localnet:
	@echo "🔧 Setting up localnet..."
	@./scripts/setup-localnet.sh

# Deploy contract
deploy: build
	@echo "🚀 Deploying contract..."
	@./scripts/deploy.sh

# Create a new game
create-game:
	@./scripts/interact.sh create

# Show game status
game-status:
	@./scripts/interact.sh status

# Show game board
game-board:
	@./scripts/interact.sh board

# Run integration tests
integration:
	@echo "🔍 Running integration tests..."
	@cd tests && cargo test

# Verify complete setup
verify: test build
	@echo "✅ All tests passed and contract built successfully!"
	@echo "💡 Ready for deployment!"