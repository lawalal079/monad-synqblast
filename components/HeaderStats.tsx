import React, { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import ChainReactionGameABI from '../abi/ChainReactionGame.json';
import ScoreBoard from './ScoreBoard';

export default function HeaderStats() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [score, setScore] = useState(0);
  const [rank, setRank] = useState<number | null>(null);
  const [roundsParticipated, setRoundsParticipated] = useState<number>(0);
  const [lastRoundPoints, setLastRoundPoints] = useState<number>(0);

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
        setScore(Number(stats[0]) / 1e18);
        setRoundsParticipated(Number(stats[2]));
        
        // Calculate last round points using the previous working logic
        const currentTotalScore = Number(stats[0]) / 1e18;
        const prevScoreKey = `prevScore_${address}`;
        const lastRoundKey = `lastRound_${address}`;
        const previousTotalScore = parseFloat(localStorage.getItem(prevScoreKey) || '0');
        const actualLastRoundPoints = Math.max(0, currentTotalScore - previousTotalScore);
        
        // If we earned points this round, store them and update previous score
        if (actualLastRoundPoints > 0) {
          localStorage.setItem(prevScoreKey, currentTotalScore.toString());
          localStorage.setItem(lastRoundKey, actualLastRoundPoints.toString());
          setLastRoundPoints(actualLastRoundPoints);
        } else {
          // No new points, use stored last round points if available
          const storedLastRound = parseFloat(localStorage.getItem(lastRoundKey) || '0');
          setLastRoundPoints(storedLastRound);
        }
      } catch (err) {
        setRank(null);
        setRoundsParticipated(0);
        setLastRoundPoints(0);
        setScore(0);
      }
    };
    fetchStats();
  }, [address, publicClient]);

  return (
    <ScoreBoard score={score} rank={rank} roundsParticipated={roundsParticipated} lastRoundPoints={lastRoundPoints} />
  );
}