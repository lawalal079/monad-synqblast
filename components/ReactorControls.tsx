'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { ethers } from 'ethers'
import ChainReactionGameABI from '../abi/ChainReactionGame.json'
import { useMultisynq } from './MultisynqGameSync'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CHAIN_REACTION_GAME_ADDRESS!;

interface ReactorControlsProps {
  isConnected: boolean
  onReactorDeployed?: () => void
  currentPhase?: string
  onScoreUpdate?: (score: number) => void
}

export default function ReactorControls({ isConnected, onReactorDeployed, currentPhase = 'DEPLOY', onScoreUpdate }: ReactorControlsProps) {
  const [selectedEnergy, setSelectedEnergy] = useState<number | 'random'>(1)
  const [isDeploying, setIsDeploying] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [showCoordinateModal, setShowCoordinateModal] = useState(false)
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  
  // Multisynq integration for real-time multiplayer
  const multisynq = useMultisynq()

  // Fetch player score when component mounts or address changes
  React.useEffect(() => {
    const fetchPlayerScore = async () => {
      if (!address || !publicClient || !onScoreUpdate) return;
      
      try {
        const playerScore = await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: ChainReactionGameABI.abi,
          functionName: 'playerScore',
          args: [address],
        });
        
        onScoreUpdate(Number(playerScore));
      } catch (error) {
        // Error fetching player score - fail silently
      }
    };

    fetchPlayerScore();
  }, [address, publicClient, onScoreUpdate]);

  const energyLevels = [
    { value: 1, label: 'Low', color: '#3b82f6', description: 'Basic reactor - Blue' },
    { value: 3, label: 'Medium', color: '#f97316', description: 'Standard reactor - Orange' },
    { value: 5, label: 'High', color: '#fbbf24', description: 'Powerful reactor - Bright Yellow' },
    { value: 10, label: 'Ultra', color: '#10b981', description: 'Maximum power - Bright Green' },
    { value: 'random', label: 'Random', color: '#8b5cf6', description: 'Random energy level - Purple' },
  ]

  const handleDeploy = async () => {
    if (!isConnected || !walletClient || !publicClient) {

      return;
    }

    if (currentPhase !== 'DEPLOY') {

      return;
    }

    setIsDeploying(true)
    setError(null)
    setTxHash(null)
    
    // Show coordinate modal
    setShowCoordinateModal(true)
  }

  const handleCoordinateSubmit = async (x: number, y: number) => {
    setShowCoordinateModal(false)
    
    try {

      
      // Handle random energy selection
      let energyToDeploy: number;
      if (selectedEnergy === 'random') {
        const energyLevels = [1, 3, 5, 10];
        const randomIndex = Math.floor(Math.random() * 4);
        energyToDeploy = energyLevels[randomIndex];

      } else {
        energyToDeploy = selectedEnergy;
      }
      
      // Map energy to ReactorType
      let reactorType: number;
      if (energyToDeploy === 1) reactorType = 3; // Low
      else if (energyToDeploy === 3) reactorType = 2; // Medium
      else if (energyToDeploy === 5) reactorType = 1; // High
      else if (energyToDeploy === 10) reactorType = 0; // Ultra
      else reactorType = 1; // Default to High if random


      
      const { request } = await publicClient!.simulateContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ChainReactionGameABI.abi,
        functionName: 'deployReactor',
        args: [x, y, reactorType, energyToDeploy],
        account: address,
      });
      


      const hash = await walletClient!.writeContract(request);
      setTxHash(hash);

      await publicClient!.waitForTransactionReceipt({ hash });


      
      // Verify deployment by checking contract state
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ChainReactionGameABI.abi, provider);
        const allReactors = await contract.getAllReactors();


        
        // Check if our reactor is in the list and track it for current round
        const ourReactor = allReactors.find((r: any) => 
          Number(r.x) === x && Number(r.y) === y && r.owner.toLowerCase() === address?.toLowerCase()
        );
        
        if (ourReactor) {
          // Track this reactor ID for the current round
          const reactorId = Number(ourReactor.id);
          const roundReactorsKey = `roundReactors_${address}`;
          const roundReactorIds = JSON.parse(localStorage.getItem(roundReactorsKey) || '[]');
          
          if (!roundReactorIds.includes(reactorId)) {
            roundReactorIds.push(reactorId);
            localStorage.setItem(roundReactorsKey, JSON.stringify(roundReactorIds));
          }
        }

      } catch (verifyError) {
        // Post-deployment verification failed - fail silently
      }
      
      // 🚀 MULTISYNQ: Sync reactor deployment with all players in real-time
      if (multisynq) {
        multisynq.deployReactor(x, y, reactorType.toString(), energyToDeploy, hash);
        console.log('🎮 Reactor deployed and synced with Multisynq:', { x, y, energy: energyToDeploy });
      }
      
      // Trigger refresh of game board using multiple methods for reliability
      
      // Method 1: localStorage (for polling mechanism)
      localStorage.setItem('reactorDeployed', Date.now().toString());
      
      // Method 2: Custom event (for event-driven refresh)
      window.dispatchEvent(new CustomEvent('reactorDeployed', { 
        detail: { x, y, energy: energyToDeploy, timestamp: Date.now() } 
      }));
      
      // Method 3: Callback (for parent component refresh)
      if (onReactorDeployed) {
        onReactorDeployed();
      }
      
      // Method 4: Force a small delay then trigger another event
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('forceRefreshBoard'));
      }, 500);
      
    } catch (error: any) {
      // Deploy reactor failed - fail silently
      setError(error.message || 'Failed to deploy reactor')
    } finally {
      setIsDeploying(false)
    }
  }




  return (
    <div className="relative bg-gradient-to-br from-gray-900/90 via-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-lg p-6 border-2 border-cyan-400 shadow-2xl shadow-cyan-500/20 overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
      <div className="relative z-10">
        <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg text-center">
          <div><span className="text-yellow-400" style={{textShadow: '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000'}}>⚡</span>REACTOR</div>
          <div>CONTROLS</div>
        </h3>
      
      {!isConnected ? (
        <div className="text-center text-gray-400 text-sm">
          Connect wallet to deploy reactors
        </div>
      ) : (
        <div className="space-y-4">
          {/* Energy Level Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Energy Level
            </label>
            <div className="space-y-2">
              {/* First 4 energy levels in 2x2 grid */}
              <div className="grid grid-cols-2 gap-2">
                {energyLevels.filter(level => level.value !== 'random').map((level) => (
                  <motion.button
                    key={level.value}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedEnergy === level.value
                        ? 'border-white/50 bg-gradient-to-r from-blue-500 to-purple-600'
                        : 'border-gray-600 bg-gradient-to-r from-blue-500/60 to-purple-600/60 hover:from-blue-500/80 hover:to-purple-600/80'
                    }`}
                    onClick={() => setSelectedEnergy(level.value as number | 'random')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div 
                      className="w-4 h-4 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: level.color }}
                    ></div>
                    <div className="text-sm font-medium text-white">{level.label}</div>
                    <div className="text-xs text-gray-400">{level.value} Energy</div>
                  </motion.button>
                ))}
              </div>
              
              {/* Random button spanning full width */}
              {energyLevels.filter(level => level.value === 'random').map((level) => (
                <motion.button
                  key={level.value}
                  className={`w-full p-3 rounded-lg border-2 transition-all ${
                    selectedEnergy === level.value
                      ? 'border-white/50 bg-gradient-to-r from-blue-500 to-purple-600'
                      : 'border-gray-600 bg-gradient-to-r from-blue-500/60 to-purple-600/60 hover:from-blue-500/80 hover:to-purple-600/80'
                  }`}
                  onClick={() => setSelectedEnergy(level.value as number | 'random')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div 
                    className="w-4 h-4 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: level.color }}
                  ></div>
                  <div className="text-sm font-medium text-white">{level.label}</div>
                  <div className="text-xs text-gray-400">{level.value} Energy</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Deployment Buttons */}
          <div className="space-y-3">
            <motion.button
              className={`w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${
                currentPhase !== 'DEPLOY' 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
              onClick={handleDeploy}
              disabled={isDeploying || currentPhase !== 'DEPLOY'}
              whileHover={currentPhase === 'DEPLOY' ? { scale: 1.02 } : {}}
              whileTap={currentPhase === 'DEPLOY' ? { scale: 0.98 } : {}}
            >
              {isDeploying ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Deploying...</span>
                </div>
              ) : (
                `Deploy ${selectedEnergy === 'random' ? 'Random' : selectedEnergy} Energy Reactor`
              )}
            </motion.button>
          </div>

          {/* Tips */}
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex items-start space-x-2">
              <span className="text-energy-yellow">💡</span>
              <span>Higher energy reactors create bigger chain reactions</span>
            </div>

          </div>
        </div>
      )}

      {/* Coordinate Modal */}
      {showCoordinateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-80">
            <h3 className="text-lg font-semibold text-white mb-4">Deploy Reactor</h3>
            <p className="text-gray-300 text-sm mb-4">Enter coordinates for your reactor (0-19)</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">X Coordinate</label>
                  <input
                    type="number"
                    id="x-coord"
                    min="0"
                    max="19"
                    defaultValue="0"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Y Coordinate</label>
                  <input
                    type="number"
                    id="y-coord"
                    min="0"
                    max="19"
                    defaultValue="0"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCoordinateModal(false);
                    setIsDeploying(false); // Reset loading state when cancelled
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const x = Number((document.getElementById('x-coord') as HTMLInputElement)?.value || 0)
                    const y = Number((document.getElementById('y-coord') as HTMLInputElement)?.value || 0)
                    if (x >= 0 && x <= 19 && y >= 0 && y <= 19) {
                      handleCoordinateSubmit(x, y)
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  Deploy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
} 