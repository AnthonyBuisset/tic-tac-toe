#!/bin/bash

set -e

echo "🔧 Setting up Stellar Localnet for Tic-Tac-Toe"

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "❌ Stellar CLI is not installed. Please install it first:"
    echo "   https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup"
    exit 1
fi

# Generate keypairs for testing
echo "🔑 Generating test keypairs..."

# Create test accounts
stellar keys generate --global alice --network localnet --fund
stellar keys generate --global bob --network localnet --fund
stellar keys generate --global charlie --network localnet --fund
stellar keys generate --global david --network localnet --fund

echo "✅ Test accounts created and funded:"
echo "   - alice"
echo "   - bob" 
echo "   - charlie"
echo "   - david"

# Show account addresses
echo ""
echo "📋 Account addresses:"
echo "   alice:   $(stellar keys address alice)"
echo "   bob:     $(stellar keys address bob)"
echo "   charlie: $(stellar keys address charlie)"
echo "   david:   $(stellar keys address david)"

echo ""
echo "🎉 Localnet setup complete!"
echo "💡 You can now deploy the contract using: ./scripts/deploy.sh"