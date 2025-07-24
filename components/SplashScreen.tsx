'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SplashScreenProps {
  onLoadingComplete: () => void
}

export default function SplashScreen({ onLoadingComplete }: SplashScreenProps) {
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showLogo, setShowLogo] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Show logo immediately
    setShowLogo(true)

    // Simulate loading progress - starts after branding is shown
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          // Start fade out after loading complete - longer delay to appreciate branding
          setTimeout(() => {
            setIsComplete(true)
            // Complete transition after fade
            setTimeout(() => {
              onLoadingComplete()
            }, 1200)
          }, 1000)
          return 100
        }
        return prev + Math.random() * 12 + 3 // Slightly slower progress for better experience
      })
    }, 300)

    return () => {
      clearInterval(progressInterval)
    }
  }, [onLoadingComplete])

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900/40 to-purple-900/40"
          style={{ zIndex: 9999 }}
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            filter: "blur(20px)",
            scale: 1.1
          }}
          transition={{ 
            duration: 1,
            ease: "easeInOut"
          }}
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-60"></div>
            <div className="absolute top-20 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-40" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-20 left-1/4 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-50" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-30" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute bottom-10 right-10 w-1 h-1 bg-green-400 rounded-full animate-ping opacity-60" style={{animationDelay: '1.5s'}}></div>
          </div>



          {/* 3D SynqBlast Logo */}
          <motion.div
            className="relative mb-16"
            initial={{ opacity: 0, y: 50, rotateX: -30 }}
            animate={showLogo ? { 
              opacity: 1, 
              y: 0, 
              rotateX: 0,
              rotateY: [0, 5, -5, 0],
            } : {}}
            transition={{ 
              duration: 1.2,
              rotateY: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            style={{ perspective: '1000px' }}
          >
            <div className="relative">
              {/* 3D Text Effect */}
              <h1 className="text-8xl font-black relative">
                {/* Shadow layers for 3D depth */}
                <span 
                  className="absolute text-gray-800 opacity-80"
                  style={{ 
                    transform: 'translate(8px, 8px) rotateX(45deg)',
                    filter: 'blur(2px)'
                  }}
                >
                  SYNQBLAST
                </span>
                <span 
                  className="absolute text-gray-700 opacity-60"
                  style={{ 
                    transform: 'translate(6px, 6px) rotateX(35deg)',
                    filter: 'blur(1px)'
                  }}
                >
                  SYNQBLAST
                </span>
                <span 
                  className="absolute text-gray-600 opacity-40"
                  style={{ 
                    transform: 'translate(4px, 4px) rotateX(25deg)'
                  }}
                >
                  SYNQBLAST
                </span>
                <span 
                  className="absolute text-gray-500 opacity-20"
                  style={{ 
                    transform: 'translate(2px, 2px) rotateX(15deg)'
                  }}
                >
                  SYNQBLAST
                </span>
                
                {/* Main text with gradient */}
                <span className="relative bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl">
                  SYNQBLAST
                </span>
                
                {/* Glowing overlay */}
                <span 
                  className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent opacity-50 animate-pulse"
                  style={{ filter: 'blur(4px)' }}
                >
                  SYNQBLAST
                </span>
              </h1>
              
              {/* Holographic shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: [-200, 200],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeInOut"
                }}
                style={{
                  transform: 'skewX(-20deg)',
                  filter: 'blur(1px)'
                }}
              />
            </div>
          </motion.div>

          {/* Loading Spinner and Progress */}
          <motion.div
            className="flex flex-col items-center space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: showLogo ? 1 : 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            {/* Custom Spinner */}
            <div className="relative">
              <motion.div
                className="w-16 h-16 border-4 border-cyan-400/30 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-cyan-400 border-r-purple-400 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-2 w-12 h-12 border-2 border-transparent border-b-pink-400 border-l-yellow-400 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>

            {/* Loading Text */}
            <motion.div
              className="text-center"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="text-xl font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Initializing Web3...
              </div>
              <div className="text-sm text-gray-400 mt-2">
                {Math.round(loadingProgress)}% Complete
              </div>
            </motion.div>

            {/* Progress Bar */}
            <div className="w-80 h-2 bg-gray-800 rounded-full overflow-hidden border border-cyan-400/30">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>

          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [-20, -100],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
