const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Starting new round on existing contract...");
  
  const contractAddress = "0x199dCC59cee8F9699129C48885B7ffffFCE37B00";
  
  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  // Get the contract
  const ChainReactionGame = await ethers.getContractFactory("ChainReactionGame");
  const contract = ChainReactionGame.attach(contractAddress);
  
  try {
    // Call startNewRound
    const tx = await contract.startNewRound();
    console.log("Transaction hash:", tx.hash);
    
    await tx.wait();
    console.log("✅ New round started successfully!");
    
    // Check the new status
    const phase = await contract.getCurrentPhase();
    const timeLeft = await contract.getPhaseTimeRemaining();
    const roundNum = await contract.currentRoundNumber();
    
    console.log("📊 New round status:");
    console.log("- Phase:", phase);
    console.log("- Time remaining:", timeLeft.toString());
    console.log("- Round number:", roundNum.toString());
    
  } catch (error) {
    console.error("❌ Error starting new round:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 