#!/bin/bash

set -e

echo "🚀 Deploying Tic-Tac-Toe Smart Contract to Stellar Testnet"

# Check if we have the required environment variable
if [ -z "$STELLAR_PRIVATE_KEY" ]; then
    echo "❌ Error: STELLAR_PRIVATE_KEY environment variable is required"
    echo "💡 This should be set as a GitHub secret containing a Stellar testnet private key"
    exit 1
fi

# Check if contract WASM exists
if [ ! -f "target/wasm32v1-none/release/tic_tac_toe.wasm" ]; then
    echo "❌ Contract WASM not found. Building contract..."
    stellar contract build
fi

echo "🌐 Configuring Stellar CLI for testnet..."

# Import the deployer key
echo "$STELLAR_PRIVATE_KEY" | stellar keys add deployer --stdin

# Fund the deployer account on testnet
echo "💰 Funding deployer account on testnet..."
stellar keys fund deployer --network testnet

echo "📦 Uploading WASM to testnet..."
WASM_HASH=$(stellar contract install \
    --network testnet \
    --source deployer \
    --wasm target/wasm32v1-none/release/tic_tac_toe.wasm)

echo "📝 WASM Hash: $WASM_HASH"

echo "🚀 Deploying contract instance..."
CONTRACT_ID=$(stellar contract deploy \
    --wasm-hash $WASM_HASH \
    --source deployer \
    --network testnet)

echo "✅ Contract deployed successfully to testnet!"
echo "📝 Contract ID: $CONTRACT_ID"
echo "🌐 Network: Testnet"
echo "💡 You can interact with this contract using:"
echo "   stellar contract invoke --id $CONTRACT_ID --source <account> --network testnet -- <method> <args>"

# Save contract ID to file for GitHub Actions output
echo "$CONTRACT_ID" > .contract-id-testnet

# Output for GitHub Actions
echo "testnet_contract_id=$CONTRACT_ID" >> $GITHUB_OUTPUT

echo ""
echo "🎮 Contract deployment complete!"
echo "📋 Summary:"
echo "   Network: Stellar Testnet"
echo "   Contract ID: $CONTRACT_ID"
echo "   WASM Hash: $WASM_HASH"