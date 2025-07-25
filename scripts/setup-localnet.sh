#!/bin/bash

set -e

echo "🔧 Setting up Stellar Localnet for Tic-Tac-Toe"

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "❌ Stellar CLI is not installed. Please install it first:"
    echo "   https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup"
    exit 1
fi

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

# Configure local network (if not already configured)
echo "⚙️ Verifying local network configuration..."
if ! stellar network ls | grep -q "^local$"; then
    stellar network add \
        --global local \
        --rpc-url http://localhost:8000/soroban/rpc \
        --network-passphrase "Standalone Network ; February 2017" \
        --horizon-url http://localhost:8000
fi

# Generate keypairs for testing
echo "🔑 Generating test keypairs..."

# Create test accounts (or use existing ones)
for account in alice bob charlie david; do
    if stellar keys address $account > /dev/null 2>&1; then
        echo "   ✓ $account already exists"
        # Try to fund existing account
        stellar keys fund $account --network local > /dev/null 2>&1 || true
    else
        echo "   + Creating $account..."
        stellar keys generate --global $account --network local --fund
    fi
done

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