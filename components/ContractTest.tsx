'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import ChainReactionGameAbi from '../abi/ChainReactionGame.json';

const CHAIN_REACTION_GAME_ADDRESS = process.env.NEXT_PUBLIC_CHAIN_REACTION_GAME_ADDRESS as string;

export default function ContractTest() {
  const [reactorCount, setReactorCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReactorCount() {
      try {
        // Use window.ethereum (MetaMask) as provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          CHAIN_REACTION_GAME_ADDRESS,
          ChainReactionGameAbi.abi,
          provider
        );
        // Call a public variable or function (e.g., nextReactorId)
        const count = await contract.nextReactorId();
        setReactorCount(Number(count));
      } catch (err: any) {
        setError(err.message || 'Error connecting to contract');
      }
    }
    fetchReactorCount();
  }, []);

  return (
    <div className="game-card">
      <h3 className="text-lg font-semibold mb-4 text-gradient">Contract Test</h3>
      {error && <div className="text-red-500">{error}</div>}
      {reactorCount !== null ? (
        <div>Next Reactor ID: {reactorCount}</div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
} 