'use client'

import React, { useState, useEffect } from 'react'
import GameBoard from '../components/GameBoard'
import { useAccount, usePublicClient } from 'wagmi'
import { ethers } from 'ethers'
import ChainReactionGameABI from '../abi/ChainReactionGame.json'
import { motion } from 'framer-motion'

export default function HomePage() {
  const [score, setScore] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [chainLength, setChainLength] = useState(0)
  const { isConnected, address } = useAccount()
  const publicClient = usePublicClient()
  const [rank, setRank] = useState<number | null>(null)
  const [roundsParticipated, setRoundsParticipated] = useState<number>(0)
  const [lastRoundPoints, setLastRoundPoints] = useState<number>(0)

  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore)
    // Save score to localStorage so leaderboard can access it
    localStorage.setItem('current-game-score', (newScore / 1e18).toString())
  }

  const handleReactorDeployed = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleChainUpdate = (length: number) => {
    setChainLength(length)
  }

  // Fetch leaderboard and player stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!address || !publicClient) return;
      try {
        // Fetch leaderboard
        const leaderboard = await publicClient.readContract({
          address: process.env.NEXT_PUBLIC_CHAIN_REACTION_GAME_ADDRESS as `0x${string}`,
          abi: ChainReactionGameABI.abi,
          functionName: 'getLeaderboard',
          args: [10],
        }) as [string[], number[]];
        const addresses = Array.from(leaderboard[0]);
        // Find rank
        const userRank = addresses.findIndex((addr) => addr.toLowerCase() === address.toLowerCase());
        setRank(userRank >= 0 ? userRank + 1 : null);
        // Fetch player stats
        const stats = await publicClient.readContract({
          address: process.env.NEXT_PUBLIC_CHAIN_REACTION_GAME_ADDRESS as `0x${string}`,
          abi: ChainReactionGameABI.abi,
          functionName: 'getPlayerStats',
          args: [address],
        }) as [number, number, number, number];
        setRoundsParticipated(Number(stats[2]));
        setLastRoundPoints(Number(stats[1]) / 1e18);
      } catch (err) {
        setRank(null);
        setRoundsParticipated(0);
        setLastRoundPoints(0);
      }
    };
    fetchStats();
  }, [address, publicClient, score, refreshKey]);

  // Provide stats to layout via context or props if needed

  return (
    <main>
      <GameBoard 
        key={refreshKey}
        isConnected={isConnected} 
        onScoreUpdate={handleScoreUpdate}
        onReactorDeployed={handleReactorDeployed}
        onChainUpdate={handleChainUpdate}
      />
      {/* Score Display (now below the game board) */}
      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="score-display">
          Score: {(score / 1e18).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        {chainLength > 0 && (
          <motion.div
            className="text-sm text-reaction-orange mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Chain Reaction: {chainLength} reactors!
          </motion.div>
        )}
            </motion.div>
      </main>
  )
} 