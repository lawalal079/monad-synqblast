# 🚀 Chain Reaction Game - Deployment Guide

## 📋 Pre-Deployment Checklist

- [ ] Hardhat configured for Monad Testnet
- [ ] Private key in `.env` file
- [ ] Sufficient MONAD test tokens for deployment
- [ ] All contracts compiled successfully

## 🔧 Deployment Steps

### 1. Compile Contracts
```bash
npx hardhat compile
```

### 2. Deploy to Monad Testnet
```bash
npx hardhat run scripts/deploy.js --network monad-testnet
```

### 3. Update Environment Variables
```bash
node scripts/update-env.js
```

### 4. Start Frontend
```bash
npm run dev
```

## 🎯 What's New in This Deployment

### ✅ Updated Rank System
- **Novice Player**: 0 - 999 points
- **Beginner Player**: 1,000 - 4,999 points  
- **Intermediate Player**: 5,000 - 19,999 points
- **Advanced Player**: 20,000 - 49,999 points
- **Chain Reactionist**: 50,000 - 99,999 points
- **Legendary Master**: 100,000+ points

### ✅ Multisynq Orchestrated Deploy
- Deploy 5 reactors in a cross pattern with one transaction
- Uses the actual MultisynqOrchestrator contract
- Fallback to individual deployments if orchestrator fails
- Real-time score and rank updates

### ✅ Enhanced Features
- Proper score conversion from 18-decimal format
- React state-based UI updates
- Automatic rank calculation
- Cross-pattern deployment (8,8 center with 4 surrounding)

## 📊 Contract Features

### ChainReactionGame.sol
- ✅ 5-minute rounds with phases (Deploy/Trigger/Scoring)
- ✅ Risk-reward system with success/failure chances
- ✅ Welcome bonus of 500 points for new players
- ✅ Max 10 reactors per user per round
- ✅ Automatic board reset per round
- ✅ Season reset every 2 months
- ✅ Per-reactor-type deployment fees

### MultisynqOrchestrator.sol
- ✅ `deployOrchestratedPattern()` function for frontend
- ✅ Cross-pattern deployment (5 reactors)
- ✅ Predefined reaction patterns
- ✅ Orchestrated reaction tracking
- ✅ Complexity scoring

## 🔗 Contract Addresses

After deployment, you'll get:
- `ChainReactionGame`: Main game contract
- `MultisynqOrchestrator`: Orchestrated deployment contract

## 🎮 Game Flow

1. **Deploy Phase** (2 minutes): Deploy reactors
2. **Trigger Phase** (2 minutes): Trigger reactors for points
3. **Scoring Phase** (1 minute): View results
4. **New Round**: Board resets, repeat

## 🏆 Rank Progression

Players start as "Novice" and must earn significant points to progress:
- Requires strategic gameplay and multiple successful triggers
- Each rank represents a meaningful achievement
- Encourages long-term engagement

## 🚨 Troubleshooting

### Common Issues:
- **Network Error**: Ensure you're on Monad Testnet
- **Gas Issues**: Increase gas limit if needed
- **Contract Not Found**: Check contract addresses in `.env.local`
- **Rank Not Updating**: Refresh page or check wallet connection

### Support:
- Check browser console for errors
- Verify contract addresses are correct
- Ensure wallet is connected to Monad Testnet

## 🎉 Ready to Deploy!

Your contracts are optimized and ready for deployment. The new rank system provides meaningful progression, and the Multisynq orchestrated deploy adds advanced functionality.

**Happy deploying! 🚀** 