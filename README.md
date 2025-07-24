# Multisynq Chain Reaction Game 🎮⚡

**Mission 6 Submission** - A novel blockchain game that uses Multisynq to create cascading chain reactions on Monad Testnet.

## 🎯 Concept

This game demonstrates the power of Multisynq by allowing players to create spectacular chain reactions across the Monad blockchain. Players deploy smart contracts that trigger other contracts, creating cascading effects that ripple through the network.

### Novel Multisynq Usage

- **Orchestrated Transactions**: Uses Multisynq to coordinate multiple interdependent smart contract calls
- **Chain Reaction Mechanics**: Each player action can trigger multiple subsequent transactions
- **Real-time Synchronization**: Leverages Multisynq's capabilities for real-time transaction orchestration
- **Competitive Gameplay**: Players compete to create the most complex and spectacular chain reactions

## 🚀 Features

- **Interactive Game Board**: Visual representation of the blockchain state
- **Smart Contract Deployment**: Deploy chain reaction contracts with different effects
- **Real-time Updates**: Watch chain reactions unfold in real-time
- **Scoring System**: Earn points based on transaction complexity and network effects
- **Leaderboard**: Compete with other players for the highest score

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Blockchain**: Monad Testnet, Multisynq
- **Smart Contracts**: Solidity, Hardhat
- **Animations**: Framer Motion

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd multisynq-chain-reaction

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run the development server
npm run dev
```

## 🔧 Configuration

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CHAIN_ID=10143
PRIVATE_KEY=your_private_key_here
```

## 🎮 How to Play

1. **Connect Wallet**: Connect your wallet to the Monad Testnet
2. **Deploy Contracts**: Deploy chain reaction contracts to the game board
3. **Create Reactions**: Position contracts to create cascading effects
4. **Watch the Chain**: Observe as your transactions trigger chain reactions
5. **Score Points**: Earn points based on the complexity and reach of your reactions

## 🏗️ Project Structure

```
├── components/          # React components
├── contracts/          # Smart contracts
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
├── pages/             # Next.js pages
├── scripts/           # Deployment scripts
└── styles/            # CSS styles
```

## 🚀 Deployment

```bash
# Deploy smart contracts to Monad Testnet
npm run deploy

# Build and deploy frontend
npm run build
npm run start
```
## 🤝 Contributing

This is a Mission 6 submission. Feel free to fork and experiment with the chain reaction mechanics!

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ By Alas {x_radar}
