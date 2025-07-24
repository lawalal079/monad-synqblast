'use client'

import React, { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { motion } from 'framer-motion'
import { ethers } from 'ethers'
import ChainReactionGameABI from '../abi/ChainReactionGame.json'
import WelcomeBonusClaimModal from './WelcomeBonusClaimModal'

const CHAIN_REACTION_GAME_ADDRESS = process.env.NEXT_PUBLIC_CHAIN_REACTION_GAME_ADDRESS as string;

interface LeaderboardEntry {
  rank: number
  address: string
  score: number
}

function formatPointsAbbreviated(points: number): string {
  if (points >= 1_000_000_000) {
    return (points / 1_000_000_000).toFixed(2) + 'b';
  } else if (points >= 1_000_000) {
    return (points / 1_000_000).toFixed(2) + 'm';
  } else if (points >= 1_000) {
    return (points / 1_000).toFixed(2) + 'k';
  } else {
    return points.toFixed(2);
  }
}

function truncateAddress(address: string): string {
  if (!address) return '';
  return address.slice(0, 6) + '...' + address.slice(-4);
}

export default function Leaderboard() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false)
  const [showWelcomeBonusModal, setShowWelcomeBonusModal] = useState(false)
  const [modalUser, setModalUser] = useState<{ address: string, points: number } | null>(null);
  const [currentRound, setCurrentRound] = useState<number | null>(null)

  // Check if user needs to claim welcome bonus
  useEffect(() => {

    
    if (!isConnected || !address) {

      return
    }
    
    const checkWelcomeBonusStatus = async () => {
      try {

        
        // Check if user has already claimed welcome bonus
        const hasClaimedBonus = localStorage.getItem(`welcome-bonus-claimed-${address}`)
        
        if (hasClaimedBonus) {
          return
        }
        
        // Check if user has any score/activity on contract to determine if they're new
        if (publicClient) {
          const contract = {
            address: process.env.NEXT_PUBLIC_CHAIN_REACTION_GAME_ADDRESS as `0x${string}`,
            abi: ChainReactionGameABI.abi,
          }
          
          const playerScore = await publicClient.readContract({
            ...contract,
            functionName: 'playerScore',
            args: [address],
          })
          
          const scoreInPoints = Number(playerScore) / 1e18
          
          // Only show welcome bonus for genuinely new users (score = 0)
          if (scoreInPoints === 0) {
            setShowWelcomeBonusModal(true)
          }
        }
      } catch (error) {

        // For new users who might not exist in contract yet, show modal

        setShowWelcomeBonusModal(true)
      }
    }
    
    // Delay check to ensure wallet is fully connected

    const timer = setTimeout(checkWelcomeBonusStatus, 2000) // Increased delay
    return () => {

      clearTimeout(timer)
    }
  }, [isConnected, address, publicClient])
  
  // Handle welcome bonus claimed
  const handleWelcomeBonusClaimed = () => {

    setShowWelcomeBonusModal(false)
    // Refresh leaderboard to show updated scores
    fetchLeaderboard()
  }

  // Helper to fetch current round number
  async function fetchCurrentRound(provider: any, contract: any): Promise<number> {
    try {
      const round = await contract.getCurrentUtcRound();
      return Number(round);
    } catch {
      return -1;
    }
  }

  // Fetch leaderboard when round changes
  useEffect(() => {
    let isMounted = true;
    let contract: any;
    let provider: any;

    async function setup() {
      provider = new ethers.BrowserProvider(window.ethereum)
      contract = new ethers.Contract(
        CHAIN_REACTION_GAME_ADDRESS,
        ChainReactionGameABI.abi,
        provider
      )
      // Initial fetch
      const round = await fetchCurrentRound(provider, contract)
      if (!isMounted) return;
      setCurrentRound(round)
      await fetchLeaderboard(contract)
    }
    setup()
    return () => {
      isMounted = false;
    }
  }, [])

  // Only update leaderboard when round changes
  useEffect(() => {
    if (!hasFetchedOnce) return;
    let contract: any;
    let provider: any;
    async function updateOnRoundChange() {
      provider = new ethers.BrowserProvider(window.ethereum)
      contract = new ethers.Contract(
        CHAIN_REACTION_GAME_ADDRESS,
        ChainReactionGameABI.abi,
        provider
      )
      const round = await fetchCurrentRound(provider, contract)
      if (round !== currentRound && round > 0) {
        setCurrentRound(round)
        await fetchLeaderboard(contract)
      }
    }
    // Listen for round change every 2 seconds (minimal polling)
    const interval = setInterval(updateOnRoundChange, 2000)
    return () => clearInterval(interval)
  }, [hasFetchedOnce, currentRound])

  async function fetchLeaderboard(contractInstance?: any) {
    setIsLoading(true)
    setError(null)
    try {
      let contract = contractInstance;
      if (!contract) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        contract = new ethers.Contract(
          CHAIN_REACTION_GAME_ADDRESS,
          ChainReactionGameABI.abi,
          provider
        )
      }
      
      // Fetch global leaderboard data from the blockchain contract

      
      let playerScores = new Map<string, number>();
      
      try {
        // Try to get all reactors to find all players who have participated
        const allReactors = await contract.getAllReactors();

        
        // Get unique player addresses from reactor owners
        const uniquePlayers = new Set<string>();
        allReactors.forEach((reactor: any) => {
          if (reactor.owner && reactor.owner !== '0x0000000000000000000000000000000000000000') {
            const normalizedAddress = reactor.owner.toLowerCase();
            uniquePlayers.add(normalizedAddress);
          }
        });
        

        
        // Fetch scores for each player from the contract
        for (const playerAddress of Array.from(uniquePlayers)) {
          try {

            const playerScore = await contract.playerScore(playerAddress);
            const scoreInPoints = Number(playerScore) / 1e18; // Convert from wei to points

            
            // Include all players, even with 0 score (they might have welcome bonus)
            playerScores.set(playerAddress, scoreInPoints);

          } catch (err) {

          }
        }
        

        
      } catch (contractError) {

      }
      
      // GLOBAL LEADERBOARD: Add all known players with their contract scores

      
      // Define all known player addresses (add new players here)
      const knownPlayers = [
        '0xe13fe0d3e1608c30b7843d8e71303201a807a9eb', // Player 1 (from contract)
        '0xc72606fa0415806FefE06D2775e001cdA174B9a5', // Player 2 (current user)
        // Add more player addresses here as they join the game
      ];
      
      // Fetch scores for all known players from contract
      for (const playerAddress of knownPlayers) {
        const normalizedAddress = playerAddress.toLowerCase();
        
        // Skip if already have this player's score
        if (playerScores.has(normalizedAddress)) {

          continue;
        }
        
        try {

          const playerScore = await contract.playerScore(normalizedAddress);
          const rawScore = playerScore.toString();
          const convertedScore = parseFloat(ethers.formatEther(rawScore));
          

          
          // Only add players with scores > 0 (have participated)
          if (convertedScore > 0) {
            playerScores.set(normalizedAddress, convertedScore);

          }
        } catch (err) {

        }
      }
      

      
      // Convert to leaderboard entries and sort by score

      
      const rawEntries = Array.from(playerScores.entries())
        .map(([address, score]) => {

          return { address, score, rank: 0 };
        });
      

      
      const sortedEntries = rawEntries.sort((a, b) => {

        return b.score - a.score;
      });
      

      
      const topEntries = sortedEntries.slice(0, 10);

      
      const entries: LeaderboardEntry[] = topEntries.map((entry, index) => {
        const finalEntry = { ...entry, rank: index + 1 };

        return finalEntry;
      });
      

      setLeaderboard(entries);
      setHasFetchedOnce(true);
    } catch (err: any) {
      // Leaderboard error - fail silently
      setError(err.message || 'Error fetching leaderboard');
    } finally {
      setIsLoading(false);
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400'
      case 2: return 'text-gray-300'
      case 3: return 'text-amber-600'
      default: return 'text-gray-400'
    }
  }

  if (isLoading && !hasFetchedOnce) {
    return (
      <div className="game-card">
        <h3 className="text-lg font-semibold mb-4 text-gradient">Leaderboard</h3>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="game-card">
        <h3 className="text-lg font-semibold mb-4 text-gradient">Leaderboard</h3>
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="relative bg-gradient-to-br from-gray-900/90 via-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-lg p-6 border-2 border-purple-400 shadow-2xl shadow-purple-500/20 overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 animate-pulse"></div>
      <div className="relative z-10">
        <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
          <span className="text-yellow-400" style={{textShadow: '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000'}}>🏆</span> LEADERBOARD
        </h3>
      <div className="space-y-3">
        {leaderboard.length === 0 && <div className="text-gray-400">No players yet.</div>}
        {leaderboard.map((entry, index) => (
          <motion.div
            key={entry.address}
            className="leaderboard-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center space-x-3 bg-gray-800/60 rounded-lg px-4 py-2 w-full">
              <div className={`text-lg font-bold ${getRankColor(entry.rank)}`}>{getRankIcon(entry.rank)}</div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-medium text-white truncate cursor-pointer font-mono"
                  title={entry.address}
                >
                  {truncateAddress(entry.address)}
                </div>
              </div>
              <div className="text-right min-w-[70px]">
                <div className="text-sm font-bold text-energy-yellow">
                  {formatPointsAbbreviated(entry.score)}
            </div>
                <div className="text-xs text-gray-400">points</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Modal for full points */}
      {modalUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg text-center">
            <h2 className="text-lg font-bold mb-2">User Details</h2>
            <div className="mb-2">Address: <span className="font-mono">{modalUser.address}</span></div>
            <div className="mb-2">Total Points: <span className="font-bold">{modalUser.points.toFixed(2)}</span></div>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setModalUser(null)}>Close</button>
          </div>
        </div>
      )}
      
      {/* Welcome Bonus Claim Modal - Moved outside via Portal */}
      {typeof window !== 'undefined' && (
        <WelcomeBonusClaimModal
          isOpen={showWelcomeBonusModal}
          onClose={() => {

            setShowWelcomeBonusModal(false)
          }}
          onClaimed={handleWelcomeBonusClaimed}
        />
      )}
      </div>
    </div>
  )
} 