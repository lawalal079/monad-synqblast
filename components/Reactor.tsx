'use client'

import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

interface ReactorData {
  id: number
  x: number
  y: number
  energy: number
  owner: string
  isActive: boolean
}

interface ReactorProps {
  reactor: ReactorData
  isSelected: boolean
  isInChain: boolean
  onClick: () => void
}

export default function Reactor({ reactor, isSelected, isInChain, onClick }: ReactorProps) {
  const [isHovered, setIsHovered] = useState(false);
  const getEnergyColor = (energy: number) => {
    // Exact color mapping for each energy level
    if (energy === 50) return '#3b82f6'   // Low - Blue
    if (energy === 100) return '#f97316'  // Medium - Orange
    if (energy === 150) return '#fbbf24'  // High - Bright Yellow
    if (energy === 200) return '#10b981'  // Ultra - Bright Green
    
    // Fallback for any other values
    return '#6b7280' // Gray
  }

  const getEnergySize = (energy: number) => {
    if (energy >= 200) return 'w-14 h-14' // Ultra - Largest
    if (energy >= 150) return 'w-12 h-12' // High - Large
    if (energy >= 100) return 'w-10 h-10' // Medium - Medium
    return 'w-8 h-8' // Low - Smallest
  }

  const getBorderClass = () => {
    if (isInChain) return 'reactor-chain'
    if (isSelected) return 'reactor-active'
    return ''
  }

  // Precompute random positions for energy particles (client only)
  const particleOffsets = useMemo(() => (
    Array.from({ length: 3 }, () => ({
      x: Math.random() * 20 - 10,
      y: Math.random() * 20 - 10
    }))
  ), [])

  return (
    <motion.div
      className={`reactor ${getEnergySize(reactor.energy)} ${getBorderClass()}`}
      style={{ 
        backgroundColor: getEnergyColor(reactor.energy),
        background: getEnergyColor(reactor.energy)
      }}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      animate={isInChain ? {
        scale: [1, 1.3, 1],
        rotate: [0, 180, 360]
      } : {}}
      transition={isInChain ? {
        duration: 0.5,
        times: [0, 0.5, 1]
      } : {}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Energy Level Indicator */}
      <div className="absolute -top-2 -right-2 bg-black/80 text-white text-xs px-1 rounded-full">
        {reactor.energy}
      </div>
      {/* Owner Indicator (show only on hover) */}
      {isHovered && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-300 truncate max-w-32 bg-black/90 px-2 py-1 rounded shadow-lg z-10">
        {reactor.owner}
      </div>
      )}
      {/* Energy Particles */}
      {reactor.isActive && (
        <div className="absolute inset-0">
          {particleOffsets.map((offset, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              animate={{
                x: [0, offset.x],
                y: [0, offset.y],
                opacity: [1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5
              }}
            />
          ))}
        </div>
      )}
      {/* Chain Reaction Glow */}
      {isInChain && (
        <motion.div
          className="absolute inset-0 rounded-full chain-glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.div>
  )
} 