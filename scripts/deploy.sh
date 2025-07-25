#!/bin/bash

set -e

echo "🚀 Deploying Tic-Tac-Toe Smart Contract to Localnet"

# Build the contract
echo "📦 Building contract..."
cd contracts/tic-tac-toe
cargo build --target wasm32-unknown-unknown --release
cd ../..

# Deploy to localnet
echo "🌐 Deploying to localnet..."
CONTRACT_ID=$(stellar contract deploy \
    --wasm contracts/tic-tac-toe/target/wasm32-unknown-unknown/release/tic_tac_toe.wasm \
    --source alice \
    --network localnet)

echo "✅ Contract deployed successfully!"
echo "📝 Contract ID: $CONTRACT_ID"

# Save contract ID for future use
echo "$CONTRACT_ID" > .contract-id
echo "💾 Contract ID saved to .contract-id"

echo ""
echo "🎮 You can now interact with your Tic-Tac-Toe contract!"
echo "💡 Use the contract ID: $CONTRACT_ID"