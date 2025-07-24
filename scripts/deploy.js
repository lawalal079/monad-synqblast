const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Multisynq Chain Reaction Game to Monad Testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy the main game contract
  console.log("📦 Deploying ChainReactionGame...");
  const ChainReactionGame = await ethers.getContractFactory("ChainReactionGame");
  const gameContract = await ChainReactionGame.deploy();
  await gameContract.waitForDeployment();
  console.log("✅ ChainReactionGame deployed to:", gameContract.target);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("ChainReactionGame:", gameContract.target);
  
  console.log("\n🔗 Network: Monad Testnet");
  console.log("🌐 Explorer: https://explorer.testnet.monad.xyz");
  
  console.log("\n📝 Next steps:");
  console.log("1. Update your .env.local file with the contract address");
  console.log("2. Run 'npm run dev' to start the frontend");
  console.log("3. Connect your wallet and start creating chain reactions!");
  
  // Save deployment info to a file
  const fs = require('fs');
  const deploymentInfo = {
    network: "Monad Testnet",
    deployer: deployer.address,
    contracts: {
      ChainReactionGame: gameContract.target
    },
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 