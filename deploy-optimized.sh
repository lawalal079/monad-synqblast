#!/bin/bash

echo "🚀 Deploying Optimized Chain Reaction Game to Monad Testnet..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your private key:"
    echo "PRIVATE_KEY=your_private_key_here"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Compile contracts
echo "🔨 Compiling contracts..."
npx hardhat compile

# Deploy to Monad Testnet
echo "🚀 Deploying to Monad Testnet..."
npx hardhat run scripts/deploy.js --network monad-testnet

echo ""
echo "✅ Deployment complete!"
echo "📋 Check deployment-info.json for contract addresses"
echo "🔗 Update your .env.local with the new contract addresses" 