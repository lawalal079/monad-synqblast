'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface ScoreBoardProps {
  score: number
  rank?: number | null
  roundsParticipated?: number
  lastRoundPoints?: number
}

export default function ScoreBoard({ score, rank, roundsParticipated, lastRoundPoints }: ScoreBoardProps) {
  return (
    <div className="flex justify-center gap-8 my-8">
      {/* Leaderboard Rank Pod - Organic Flowing Shape */}
      <motion.div 
        className="relative group cursor-pointer"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <svg 
          width="220" 
          height="100" 
          viewBox="0 0 220 100" 
          className="absolute inset-0 z-0"
        >
          <defs>
            <linearGradient id="rankGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.5" />
            </linearGradient>
            <filter id="rankGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/> 
              </feMerge>
            </filter>
          </defs>
          {/* Organic flowing shape inspired by reference */}
          <path 
            d="M15 50 C15 25, 35 10, 60 15 C85 8, 115 12, 140 20 C165 15, 185 25, 200 40 C210 55, 205 70, 190 80 C170 90, 145 85, 120 82 C95 88, 70 85, 45 75 C25 70, 15 60, 15 50 Z" 
            fill="url(#rankGradient)" 
            stroke="#fbbf24" 
            strokeWidth="2" 
            filter="url(#rankGlow)"
            className="animate-pulse"
          />
          {/* Additional flowing accent line */}
          <path 
            d="M20 45 C40 35, 80 38, 120 42 C160 38, 190 45, 195 50" 
            fill="none" 
            stroke="#fbbf24" 
            strokeWidth="1" 
            opacity="0.6"
            className="animate-pulse"
          />
        </svg>
        <div className="relative z-10 px-8 py-4 text-center min-w-[200px] h-[100px] flex flex-col justify-center">
          <motion.div 
            className="text-3xl font-black text-yellow-300 mb-1 drop-shadow-lg"
            animate={{ textShadow: ['0 0 10px #fbbf24', '0 0 20px #fbbf24', '0 0 10px #fbbf24'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {rank ?? '-'}
          </motion.div>
          <div className="text-xs text-yellow-200 font-semibold tracking-wide uppercase">LEADERBOARD RANK</div>
        </div>
      </motion.div>

      {/* Rounds Participated Pod - Organic Flowing Shape */}
      <motion.div 
        className="relative group cursor-pointer"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <svg 
          width="220" 
          height="100" 
          viewBox="0 0 220 100" 
          className="absolute inset-0 z-0"
        >
          <defs>
            <linearGradient id="roundsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ea580c" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#c2410c" stopOpacity="0.5" />
            </linearGradient>
            <filter id="roundsGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/> 
              </feMerge>
            </filter>
          </defs>
          {/* Organic flowing shape with different curves */}
          <path 
            d="M20 45 C25 20, 50 8, 75 18 C100 5, 130 15, 155 25 C180 18, 200 30, 205 50 C200 70, 180 82, 155 75 C130 85, 100 80, 75 72 C50 82, 25 70, 20 45 Z" 
            fill="url(#roundsGradient)" 
            stroke="#f97316" 
            strokeWidth="2" 
            filter="url(#roundsGlow)"
            className="animate-pulse"
            style={{ animationDelay: '0.5s' }}
          />
          {/* Additional flowing accent line */}
          <path 
            d="M25 50 C55 40, 95 45, 135 48 C175 42, 195 52, 200 55" 
            fill="none" 
            stroke="#f97316" 
            strokeWidth="1" 
            opacity="0.6"
            className="animate-pulse"
          />
        </svg>
        <div className="relative z-10 px-8 py-4 text-center min-w-[200px] h-[100px] flex flex-col justify-center">
          <motion.div 
            className="text-3xl font-black text-orange-300 mb-1 drop-shadow-lg"
            animate={{ textShadow: ['0 0 10px #f97316', '0 0 20px #f97316', '0 0 10px #f97316'] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          >
            {roundsParticipated ?? '-'}
          </motion.div>
          <div className="text-xs text-orange-200 font-semibold tracking-wide uppercase">ROUNDS PLAYED</div>
        </div>
      </motion.div>

      {/* Last Round Points Pod - Organic Flowing Shape */}
      <motion.div 
        className="relative group cursor-pointer"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <svg 
          width="220" 
          height="100" 
          viewBox="0 0 220 100" 
          className="absolute inset-0 z-0"
        >
          <defs>
            <linearGradient id="pointsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#16a34a" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#15803d" stopOpacity="0.5" />
            </linearGradient>
            <filter id="pointsGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/> 
              </feMerge>
            </filter>
          </defs>
          {/* Organic flowing shape with unique curves */}
          <path 
            d="M18 55 C22 30, 45 12, 70 20 C95 10, 125 18, 150 28 C175 20, 195 35, 202 55 C195 75, 175 85, 150 78 C125 88, 95 82, 70 75 C45 85, 22 75, 18 55 Z" 
            fill="url(#pointsGradient)" 
            stroke="#22c55e" 
            strokeWidth="2" 
            filter="url(#pointsGlow)"
            className="animate-pulse"
            style={{ animationDelay: '1s' }}
          />
          {/* Additional flowing accent line */}
          <path 
            d="M23 52 C53 42, 93 47, 133 50 C173 45, 193 55, 198 58" 
            fill="none" 
            stroke="#22c55e" 
            strokeWidth="1" 
            opacity="0.6"
            className="animate-pulse"
          />
        </svg>
        <div className="relative z-10 px-8 py-4 text-center min-w-[200px] h-[100px] flex flex-col justify-center">
          <motion.div 
            className="text-3xl font-black text-green-300 mb-1 drop-shadow-lg"
            animate={{ textShadow: ['0 0 10px #22c55e', '0 0 20px #22c55e', '0 0 10px #22c55e'] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          >
            {lastRoundPoints?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) ?? '-'}
          </motion.div>
          <div className="text-xs text-green-200 font-semibold tracking-wide uppercase">LAST ROUND PTS</div>
        </div>
      </motion.div>
    </div>
  )
} 