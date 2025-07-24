'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { ethers } from 'ethers'
import ChainReactionGameABI from '../abi/ChainReactionGame.json'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CHAIN_REACTION_GAME_ADDRESS!

interface WelcomeBonusClaimModalProps {
  isOpen: boolean
  onClose: () => void
  onClaimed: () => void
}

export default function WelcomeBonusClaimModal({ isOpen, onClose, onClaimed }: WelcomeBonusClaimModalProps) {

  
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimStatus, setClaimStatus] = useState<'idle' | 'claiming' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [txHash, setTxHash] = useState('')

  const handleClaimWelcomeBonus = async () => {

    
    if (!isConnected || !address) {

      setErrorMessage('Please connect your wallet first')
      setClaimStatus('error')
      return
    }
    
    // Use direct ethers.js provider instead of wagmi publicClient
    if (!walletClient) {

      setErrorMessage('Wallet client is loading, please try again in a moment')
      setClaimStatus('error')
      return
    }


    setIsClaiming(true)
    setClaimStatus('claiming')
    setErrorMessage('')

    try {
      // Use wagmi pattern like ReactorControls for proper contract interaction
      if (!publicClient || !walletClient) {
        setErrorMessage('Wallet client is not ready, please try again')
        setClaimStatus('error')
        return
      }

      // Simulate the contract call first
      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ChainReactionGameABI.abi,
        functionName: 'deployReactor',
        args: [10, 10, 3, 1], // Deploy at (10,10) with Low reactor type and 1 energy
        account: address,
      });
      
      // Execute the transaction
      const hash = await walletClient.writeContract(request);
      setTxHash(hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      
      setClaimStatus('success')
      
      // Save claim status to localStorage
      localStorage.setItem(`welcome-bonus-claimed-${address}`, 'true')
      localStorage.setItem('current-game-score', '500') // Set initial score
      
      // Notify parent component
      setTimeout(() => {
        onClaimed()
        onClose()
      }, 2000)
      
    } catch (error: any) {
      // Welcome bonus claim failed - fail silently
      setErrorMessage(error.message || 'Failed to claim welcome bonus')
      setClaimStatus('error')
    } finally {
      setIsClaiming(false)
    }
  }

  const handleClose = () => {
    if (!isClaiming) {
      onClose()
    }
  }

  if (!isOpen) return null

  // Render modal using Portal to escape container constraints
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={handleClose}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Welcome Bonus
            </h2>
            <p className="text-gray-300 text-lg">
              Claim your <span className="text-yellow-400 font-bold">500 points</span> welcome bonus!
            </p>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-6">
            <div className="bg-black/30 rounded-lg p-4 border border-cyan-500/20">
              <h3 className="text-cyan-400 font-semibold mb-2">🔗 Onchain Interaction Required</h3>
              <p className="text-gray-300 text-sm">
                To claim your welcome bonus, you'll need to make an onchain transaction on Monad testnet. 
                This requires paying a small gas fee but ensures your bonus is properly recorded on the blockchain.
              </p>
            </div>
            
            <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
              <h3 className="text-purple-400 font-semibold mb-2">💰 What You Get</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• 500 starting points</li>
                <li>• Your first reactor deployment</li>
                <li>• Entry into the global leaderboard</li>
                <li>• Ready to start playing!</li>
              </ul>
            </div>
          </div>

          {/* Status Messages */}
          {claimStatus === 'claiming' && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="text-blue-400 font-semibold">Claiming Welcome Bonus...</p>
                  <p className="text-gray-300 text-sm">Please confirm the transaction in your wallet</p>
                </div>
              </div>
            </div>
          )}

          {claimStatus === 'success' && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-green-400 text-xl">✅</div>
                <div>
                  <p className="text-green-400 font-semibold">Welcome Bonus Claimed!</p>
                  <p className="text-gray-300 text-sm">You've received 500 points. Welcome to the game!</p>
                  {txHash && (
                    <p className="text-gray-400 text-xs mt-1">
                      TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {claimStatus === 'error' && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-red-400 text-xl">❌</div>
                <div>
                  <p className="text-red-400 font-semibold">Claim Failed</p>
                  <p className="text-gray-300 text-sm">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {claimStatus === 'idle' && (
              <>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 bg-gray-600/50 hover:bg-gray-600/70 text-gray-300 rounded-lg transition-colors"
                  disabled={isClaiming}
                >
                  Maybe Later
                </button>
                <button
                  onClick={(e) => {

                    e.preventDefault()
                    e.stopPropagation()
                    handleClaimWelcomeBonus()
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isClaiming}
                  type="button"
                >
                  Claim Bonus 🎁
                </button>
              </>
            )}
            
            {claimStatus === 'claiming' && (
              <button
                className="w-full px-4 py-3 bg-blue-500/50 text-blue-300 rounded-lg cursor-not-allowed"
                disabled
              >
                Processing Transaction...
              </button>
            )}
            
            {claimStatus === 'error' && (
              <>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 bg-gray-600/50 hover:bg-gray-600/70 text-gray-300 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setClaimStatus('idle')
                    setErrorMessage('')
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
