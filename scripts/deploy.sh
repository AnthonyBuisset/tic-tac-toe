#!/bin/bash

set -e

echo "🚀 Deploying Tic-Tac-Toe Smart Contract to Localnet"

# Check if localnet is running
echo "🌐 Checking localnet status..."
if ! curl -s http://localhost:8000/soroban/rpc > /dev/null 2>&1; then
    echo "❌ Localnet is not running!"
    echo "💡 Please start localnet first:"
    echo "   stellar network start local"
    echo ""
    echo "   Then run this script again."
    exit 1
fi

echo "✅ Localnet is running"

# Build the contract
echo "📦 Building contract..."
stellar contract build

# Upload and deploy to localnet
echo "🌐 Uploading WASM to localnet..."
WASM_HASH=$(stellar contract upload \
    --wasm target/wasm32v1-none/release/tic_tac_toe.wasm \
    --source alice \
    --network local)

echo "📝 WASM Hash: $WASM_HASH"

echo "🚀 Deploying contract instance..."
CONTRACT_ID=$(stellar contract deploy \
    --wasm-hash $WASM_HASH \
    --source alice \
    --network local)

echo "✅ Contract deployed successfully!"
echo "📝 Contract ID: $CONTRACT_ID"

# Save contract ID for future use
echo "$CONTRACT_ID" > .contract-id
echo "💾 Contract ID saved to .contract-id"

echo ""
echo "🎮 You can now interact with your Tic-Tac-Toe contract!"
echo "💡 Use the contract ID: $CONTRACT_ID"