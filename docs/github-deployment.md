# GitHub Actions Testnet Deployment

This guide explains how to set up automatic testnet deployment for releases.

## Prerequisites

You need a GitHub repository secret containing a Stellar testnet private key that will be used to deploy contracts.

## Setting up the GitHub Secret

### 1. Generate a Testnet Account

First, create a new account for deployment:

```bash
# Generate a new keypair
stellar keys generate deployer --network testnet

# Get the secret key (this will be your GitHub secret)
stellar keys show deployer --secret
```

### 2. Fund the Account

Fund the account on testnet:

```bash
stellar keys fund deployer --network testnet
```

### 3. Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `STELLAR_TESTNET_PRIVATE_KEY`
5. Value: The secret key from step 1 (starts with `S...`)
6. Click **Add secret**

## How the Deployment Works

When you create a release (push a tag starting with `v`), the GitHub action will:

1. **Build** the optimized contract
2. **Deploy** to Stellar testnet using the secret key
3. **Output** the contract ID in the release notes
4. **Include** the contract ID file in release assets

## Release Process

1. **Tag your release**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **GitHub Actions will automatically**:
   - Build the contract
   - Deploy to testnet
   - Create a release with the contract ID

3. **The release will include**:
   - Live contract ID for immediate use
   - Compiled WASM file
   - Complete source code package
   - Frontend application

## Using the Deployed Contract

The release notes will contain the testnet contract ID. You can use it immediately:

### With CLI
```bash
stellar contract invoke \
  --id <CONTRACT_ID_FROM_RELEASE> \
  --source <your-account> \
  --network testnet \
  -- create_game \
  --player_x alice \
  --player_o bob
```

### With Frontend
1. Clone the repository or download the release
2. Start the frontend: `make frontend-dev`
3. Select "Testnet" network
4. Connect your Freighter wallet
5. Play games using the deployed contract

## Security Notes

- The deployment account only needs enough XLM for deployment fees
- Keep the private key secure as a GitHub secret
- The account will be funded automatically via Friendbot on testnet
- Never use mainnet private keys in GitHub secrets

## Troubleshooting

**Deployment fails with "insufficient funds"**:
- The account may need more XLM
- Try funding it again: `stellar keys fund deployer --network testnet`

**"STELLAR_TESTNET_PRIVATE_KEY not found"**:
- Ensure the GitHub secret is set correctly
- Check the secret name matches exactly

**Contract deployment fails**:
- Check that the WASM built successfully
- Verify testnet is accessible
- Ensure the private key is valid for testnet