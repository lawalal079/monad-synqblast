const fs = require('fs');

// Read deployment info
const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));

console.log('🔧 Updating environment variables...');

// Read current .env if it exists
let envContent = '';
try {
  envContent = fs.readFileSync('.env', 'utf8');
} catch (error) {
  console.log('No existing .env found, creating new one...');
}

// Update or add contract address
const gameAddress = `NEXT_PUBLIC_CHAIN_REACTION_GAME_ADDRESS=${deploymentInfo.contracts.ChainReactionGame}`;

// Remove old address if it exists
envContent = envContent.replace(/NEXT_PUBLIC_CHAIN_REACTION_GAME_ADDRESS=.*\n?/g, '');

// Add new address
envContent += `\n${gameAddress}\n`;

// Write updated .env
fs.writeFileSync('.env', envContent);

console.log('✅ Environment variables updated!');
console.log('📋 Updated address:');
console.log(`ChainReactionGame: ${deploymentInfo.contracts.ChainReactionGame}`);
console.log('\n🚀 Ready to deploy! Run: npx hardhat run scripts/deploy.js --network monad-testnet'); 