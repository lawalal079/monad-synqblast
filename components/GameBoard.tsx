'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Reactor from './Reactor'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { ethers } from 'ethers';
import ChainReactionGameABI from '../abi/ChainReactionGame.json';

interface GameBoardProps {
  isConnected: boolean
  onScoreUpdate: (score: number) => void
  onReactorDeployed?: () => void
  onChainUpdate: (length: number) => void
}

interface ReactorData {
  id: number
  x: number
  y: number
  energy: number
  owner: string
  isActive: boolean
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CHAIN_REACTION_GAME_ADDRESS!;

function getUtcRoundInfo() {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcSeconds = now.getUTCSeconds();
  const secondsSinceMidnight = utcHours * 3600 + utcMinutes * 60 + utcSeconds;
  const roundDuration = 5 * 60; // 5 minutes in seconds
  const totalRounds = 288;
  const currentRound = Math.floor(secondsSinceMidnight / roundDuration) + 1; // 1-based
  const roundStart = Math.floor(secondsSinceMidnight / roundDuration) * roundDuration;
  const secondsIntoRound = secondsSinceMidnight - roundStart;
  // Phase durations
  const DEPLOY_PHASE_DURATION = 2 * 60;
  const TRIGGER_PHASE_DURATION = 2 * 60;
  const SCORING_PHASE_DURATION = 1 * 60;
  let phase = 'DEPLOY';
  let phaseTime = DEPLOY_PHASE_DURATION - secondsIntoRound;
  if (secondsIntoRound >= DEPLOY_PHASE_DURATION) {
    phase = 'TRIGGER';
    phaseTime = DEPLOY_PHASE_DURATION + TRIGGER_PHASE_DURATION - secondsIntoRound;
  }
  if (secondsIntoRound >= DEPLOY_PHASE_DURATION + TRIGGER_PHASE_DURATION) {
    phase = 'SCORING';
    phaseTime = DEPLOY_PHASE_DURATION + TRIGGER_PHASE_DURATION + SCORING_PHASE_DURATION - secondsIntoRound;
  }
  if (phaseTime < 0) phaseTime = 0;
  return { currentRound, totalRounds, phase, phaseTime };
}

export default function GameBoard({ isConnected, onScoreUpdate, onReactorDeployed, onChainUpdate }: GameBoardProps) {
  const [reactors, setReactors] = useState<ReactorData[]>([]);
  const [selectedReactor, setSelectedReactor] = useState<number | null>(null);
  const [selectedReactors, setSelectedReactors] = useState<number[]>([]);
  const [chainReaction, setChainReaction] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showNewRoundNotification, setShowNewRoundNotification] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'private' | 'public'>('private');
  const lastRoundNumberRef = useRef<number>(getUtcRoundInfo().currentRound); // Initialize with current round
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [utcRoundInfo, setUtcRoundInfo] = useState(getUtcRoundInfo());
  
  // Force clear function for manual testing
  const forceClearReactors = () => {

    setReactors([]);
    setSelectedReactors([]);
    setSelectedReactor(null);
    setChainReaction([]);
  };

  useEffect(() => {
    onChainUpdate(chainReaction.length);
  }, [chainReaction, onChainUpdate]);

  const BOARD_SIZE = 20;
  // Card padding is p-6 = 24px on each side, border-2 = 2px on each side
  const CARD_PADDING = 24 * 2; // 48px (p-6)
  const BORDER_WIDTH = 2 * 2; // 4px (border-2)
  const GRID_SIZE = 30; // Each cell is 30px
  const CARD_OUTER_WIDTH = BOARD_SIZE * GRID_SIZE + CARD_PADDING + BORDER_WIDTH;
  const CARD_OUTER_HEIGHT = BOARD_SIZE * GRID_SIZE + CARD_PADDING + BORDER_WIDTH;

  // Fetch all reactors from contract with proper round sync
  const fetchReactors = async () => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ChainReactionGameABI.abi, provider);
      
      // Get current UTC round info for accurate round detection
      const currentUtcRound = getUtcRoundInfo();
      let currentContractRound;
      
      // Try different contract round functions to find the right one
      try {
        currentContractRound = await contract.getCurrentUtcRound();

      } catch (err) {
        try {
          currentContractRound = await contract.getCurrentRoundNumber();

        } catch (err2) {

          currentContractRound = currentUtcRound.currentRound;
        }
      }
      
      // Use UI round for detection since it's more reliable
      const actualRound = currentUtcRound.currentRound;
      if (actualRound !== lastRoundNumberRef.current) {
        // Clear all local state immediately
        setReactors([]);
        setSelectedReactors([]);
        setSelectedReactor(null);
        setChainReaction([]);
        
        // Clear localStorage reactor round tracking for new round
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('reactor_') && key.endsWith('_round')) {
            localStorage.removeItem(key);
          }
          if (key.startsWith('currentRoundReactors_')) {
            localStorage.removeItem(key);
          }
          if (key.startsWith('deployedThisRound_')) {
            localStorage.removeItem(key);
          }
        });
        
        // Update round tracking
        lastRoundNumberRef.current = actualRound;
        setUtcRoundInfo(currentUtcRound);
        
        // Force a short delay and return early to ensure state is cleared
        setLoading(false);
        return;
      }
      
      // Fetch reactors from contract (should be empty if new round just started)
      const allReactors = await contract.getAllReactors();
      
      // NUCLEAR OPTION: Block ALL old reactors - only show empty board until new deployment
      const currentRoundNumber = Number(actualRound); // Normalize to number
      const activeReactors = [];
      
      // DEAD SIMPLE: Show only the user's most recent reactor
      // This eliminates all the complex round tracking that's causing issues
      
      if (address) {
        let mostRecentReactor = null;
        let highestId = 0;
        
        // Find the user's most recent reactor
        for (let i = 0; i < allReactors.length; i++) {
          const r = allReactors[i];
          if (r.isActive && 
              r.owner.toLowerCase() === address.toLowerCase() && 
              Number(r.id) > highestId) {
            highestId = Number(r.id);
            mostRecentReactor = {
              id: Number(r.id),
              x: Number(r.x),
              y: Number(r.y),
              energy: Number(r.energy),
              owner: r.owner,
              isActive: r.isActive
            };
          }
        }
        
        // Show only the most recent reactor
        if (mostRecentReactor) {
          activeReactors.push(mostRecentReactor);
        }
      }
      

      
      setReactors(activeReactors);
      
    } catch (err) {
      // On error, clear reactors to prevent stale state
      setReactors([]);
    }
    setLoading(false);
  };

  // Fetch player score from contract
  const fetchPlayerScore = async () => {
    if (!address) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ChainReactionGameABI.abi, provider);
      const playerScore = await contract.playerScore(address);
      const realScore = Number(playerScore);
      setScore(realScore);
      onScoreUpdate(realScore);
    } catch (err) {
      // Error fetching player score - fail silently
    }
  };

  // Manual refresh function
  const refreshBoard = async () => {
    await fetchReactors();
    await fetchPlayerScore();
  };

  // Handle grid click (for future deployment UI)
  const handleGridClick = (x: number, y: number) => {

    // Future: Could open deployment modal here
  };

  // Handle reactor selection for highlighting and multi-trigger
  const handleReactorSelect = (reactorId: number) => {
    // Toggle selection for multi-trigger
    if (selectedReactors.includes(reactorId)) {
      // Deselect reactor
      setSelectedReactors(prev => {
        const newSelection = prev.filter(id => id !== reactorId);
        return newSelection;
      });
    } else {
      // Select reactor (limit to 10 for multi-trigger)
      if (selectedReactors.length < 10) {
        setSelectedReactors(prev => {
          const newSelection = [...prev, reactorId];
          return newSelection;
        });
      }
    }
    // Also set single reactor selection for individual trigger
    setSelectedReactor(reactorId);
  };

  // Handle reactor click for triggering
  const handleReactorClick = async (reactorId: number) => {
    if (!isConnected || !walletClient || !publicClient) {
      return;
    }

    // Check if we're in trigger phase
    if (utcRoundInfo.phase !== 'TRIGGER') {
      return;
    }

    const reactor = reactors.find(r => r.id === reactorId);
    if (!reactor) {
      return;
    }

    // Check if this is your reactor
    if (reactor.owner !== address) {
      return;
    }

    try {
      const { request } = await publicClient!.simulateContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ChainReactionGameABI.abi,
        functionName: 'triggerReactor',
        args: [[reactorId]], // Pass as array of reactor IDs
        account: address,
      });
      
      const hash = await walletClient!.writeContract(request);
      
      await publicClient!.waitForTransactionReceipt({ hash });
      
      // Show temporary visual feedback and refresh the board
      
      // Add temporary visual feedback
      const reactorElement = document.querySelector(`[data-reactor-id="${reactorId}"]`);
      if (reactorElement) {
        reactorElement.classList.add('reactor-triggered');
        setTimeout(() => {
          reactorElement.classList.remove('reactor-triggered');
        }, 1000);
      }
      
      await refreshBoard();
      
    } catch (error) {
      // Trigger reactor failed - fail silently
    }
  };



  // Multi-trigger handler
  const handleMultiTrigger = async () => {
    if (!isConnected || !walletClient || !publicClient) {
      return;
    }
    
    if (selectedReactors.length === 0) {
      return;
    }
    
    if (utcRoundInfo.phase !== 'TRIGGER') {
      return;
    }
    
    try {
      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ChainReactionGameABI.abi,
        functionName: 'triggerReactor',
        args: [selectedReactors],
        account: address,
      });
      
      const hash = await walletClient.writeContract(request);
      
      await publicClient.waitForTransactionReceipt({ hash });
      
      setSelectedReactors([]); // Clear selection after trigger
      await refreshBoard();
    } catch (error) {
      // Multi-trigger failed - fail silently
    }
  };

  // Use UTC timer for round status (removed contract-based timer)

  useEffect(() => {
    if (isConnected) {
      fetchReactors();
      fetchPlayerScore();
    }
    // eslint-disable-next-line
  }, [isConnected, address, refreshTrigger]);

  // Monitor for round changes and auto-refresh
  useEffect(() => {
    if (!isConnected) return;
    
    const checkRoundChange = async () => {
      try {
        const currentUtcRound = getUtcRoundInfo();
        
        // Check if round has changed
        if (currentUtcRound.currentRound !== lastRoundNumberRef.current) {
          
          // Update UTC round info
          setUtcRoundInfo(currentUtcRound);
          
          // Refresh board to sync with contract
          await fetchReactors();
          await fetchPlayerScore();
        }
      } catch (err) {
        // Error checking round change - fail silently
      }
    };
    
    // Check immediately
    checkRoundChange();
    
    // Set up interval to check every 5 seconds
    const interval = setInterval(checkRoundChange, 5000);
    
    return () => clearInterval(interval);
  }, [isConnected, address]);

  // Add effect to handle onReactorDeployed callback
  useEffect(() => {
    if (onReactorDeployed) {
      // Override the callback to include immediate refresh
      const originalCallback = onReactorDeployed;
      const enhancedCallback = () => {

        refreshBoard();
        originalCallback();
      };
      // This effect runs when the callback changes
    }
  }, [onReactorDeployed]);

  // Auto-refresh when a reactor is deployed
  useEffect(() => {
    const handleStorageChange = () => {
      const deployed = localStorage.getItem('reactorDeployed');
      if (deployed) {

        refreshBoard();
        localStorage.removeItem('reactorDeployed');
      }
    };

    const handleReactorDeployedEvent = (event: any) => {

      
      // Mark that we deployed in this round
      const currentRound = getUtcRoundInfo().currentRound;
      const deployedThisRoundKey = `deployedThisRound_${currentRound}`;
      localStorage.setItem(deployedThisRoundKey, 'true');

      
      refreshBoard();
    };

    const handleForceRefresh = () => {

      refreshBoard();
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom deployment events
    window.addEventListener('reactorDeployed', handleReactorDeployedEvent);
    window.addEventListener('forceRefreshBoard', handleForceRefresh);
    
    // Also check immediately and every 3 seconds as backup
    handleStorageChange();
    const interval = setInterval(handleStorageChange, 3000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('reactorDeployed', handleReactorDeployedEvent);
      window.removeEventListener('forceRefreshBoard', handleForceRefresh);
      clearInterval(interval);
    };
  }, []);

  // Phase durations (seconds)
  const DEPLOY_PHASE_DURATION = 120;   // 2 minutes
  const TRIGGER_PHASE_DURATION = 120;  // 2 minutes
  const SCORING_PHASE_DURATION = 60;   // 1 minute
  const ROUND_DURATION = DEPLOY_PHASE_DURATION + TRIGGER_PHASE_DURATION + SCORING_PHASE_DURATION; // 300

  // Remove local timer logic and always use contract values
  // const [phase, setPhase] = useState<string>('DEPLOY');
  // const [phaseTime, setPhaseTime] = useState<number>(120);
  // const [roundNumber, setRoundNumber] = useState<number>(1);
  // const [showNewRoundNotification, setShowNewRoundNotification] = useState<boolean>(false);
  // const lastRoundNumberRef = useRef<number>(1);

  // Check for new round using UTC timer
  useEffect(() => {
    if (!isConnected) return;
    
    const checkNewRound = () => {
      const currentRound = utcRoundInfo.currentRound;
      if (currentRound > lastRoundNumberRef.current) {
          setShowNewRoundNotification(true);
        lastRoundNumberRef.current = currentRound;
          setTimeout(() => setShowNewRoundNotification(false), 3000);
      }
    };
    
    checkNewRound();
    const interval = setInterval(checkNewRound, 1000);
    return () => clearInterval(interval);
  }, [isConnected, utcRoundInfo.currentRound]);

  // All usages of 'phase' should now refer to the state variable from useState.
  // Debug logging
  useEffect(() => {

  }, [reactors.length]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Removed old round number check - now using UTC timer

  // Removed old phaseTime useEffect - now using UTC timer

  useEffect(() => {
    const interval = setInterval(() => {
      setUtcRoundInfo(getUtcRoundInfo());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter reactors for private/public view
  const displayedReactors = viewMode === 'private' && address
    ? reactors.filter(r => r.owner === address)
    : reactors;

  return (
    <>
      {/* New Round Notification */}
      {showNewRoundNotification && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-black/80 text-white text-6xl font-bold p-8 rounded-lg border-4 border-white">
            NEW ROUND
          </div>
        </motion.div>
      )}
      {/* Timer/Phase Bar with gaming effects */}
      <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-4 rounded-lg text-center mb-8 border-2 border-cyan-400 shadow-2xl shadow-cyan-500/20 overflow-hidden">
        {/* Animated background pulse */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 animate-pulse"></div>
        <div className="relative z-10">
        <div className="text-xl font-bold">
          {utcRoundInfo.phase === 'DEPLOY' && (
            <span className="text-green-400 drop-shadow-lg">
              🚀 Deploy: <span className="text-cyan-300">{formatTime(utcRoundInfo.phaseTime)}</span>
            </span>
          )}
          {utcRoundInfo.phase === 'TRIGGER' && (
            <span className="text-orange-400 drop-shadow-lg">
              ⚡ Trigger: <span className="text-yellow-300">{formatTime(utcRoundInfo.phaseTime)}</span>
            </span>
          )}
          {utcRoundInfo.phase === 'SCORING' && (
            <span className="text-purple-400 drop-shadow-lg">
              🏆 New Round in: <span className="text-pink-300">{formatTime(utcRoundInfo.phaseTime)}</span>
            </span>
          )}
        </div>
        <div className="text-sm text-gray-300 mt-1">
          Round {utcRoundInfo.currentRound}/{utcRoundInfo.totalRounds} • Phase: {utcRoundInfo.phase}
        </div>
        </div>
      </div>
      {/* Chain Reaction Board in its own card */}
      <div className="relative border-2 border-cyan-400 rounded-lg mb-8 w-fit mx-auto p-8 bg-gradient-to-br from-gray-900/90 via-blue-900/20 to-purple-900/30 shadow-2xl shadow-cyan-500/20">
        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 animate-pulse"></div>
        <div className="relative z-10">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gradient">
            Chain Reaction Board
          </h2>
        <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-400">
              {displayedReactors.length} Reactors Active
            </div>
            {/* Board View Toggle (moved here) */}
            <div className="flex space-x-0">
              <button
                className={`px-4 py-2 rounded-l-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${
                  viewMode === 'private' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => setViewMode('private')}
              >
                My Board
              </button>
              <button
                className={`px-4 py-2 rounded-r-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${
                  viewMode === 'public' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => setViewMode('public')}
              >
                Public Board
              </button>
            </div>
          </div>
        </div>
      <div className="relative">
  
        {/* Game Grid - 20x20 perfectly contained with eye-catching effects */}
        <div 
          className="grid gap-0 bg-gradient-to-br from-gray-900 via-blue-900/30 to-purple-900/30 border-2 border-cyan-400 rounded-lg overflow-hidden shadow-2xl shadow-cyan-500/30 relative"
          style={{
            gridTemplateColumns: `repeat(20, 1fr)`,
            gridTemplateRows: `repeat(20, 1fr)`,
            width: '600px',
            height: '600px',
            aspectRatio: '1/1',
          }}
        >
          {/* Animated grid overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse pointer-events-none"></div>
          {Array.from({ length: 400 }, (_, i) => {
            const x = i % 20
            const y = Math.floor(i / 20)
            return (
              <motion.div
                key={i}
                className="w-full h-full border-r border-b border-cyan-500/20 cursor-pointer hover:bg-gradient-to-br hover:from-cyan-500/20 hover:to-purple-500/20 transition-all duration-300 flex items-center justify-center relative group hover:shadow-lg hover:shadow-cyan-500/30"
                onClick={() => {

                  if (viewMode === 'private') {
                    handleGridClick(x, y);
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ pointerEvents: 'auto' }}
              />
            )
          })}
        </div>
        {/* Reactors */}
        <AnimatePresence>
            {displayedReactors.map((reactor) => (
            <motion.div
              key={reactor.id}
                className={`absolute ${selectedReactors.includes(reactor.id) ? 'ring-4 ring-blue-400 z-10' : ''}`}
                data-reactor-id={reactor.id}
              style={{
                left: `${reactor.x * 30 + 15}px`,
                top: `${reactor.y * 30 + 15}px`,
                transform: 'translate(-50%, -50%)'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Reactor
                reactor={reactor}
                isSelected={selectedReactor === reactor.id}
                isInChain={chainReaction.includes(reactor.id)}
                onClick={() => {

                  if (viewMode === 'private') {
                    handleReactorSelect(reactor.id);
                  } else {
                    handleReactorClick(reactor.id);
                  }
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {/* Chain Reaction Lines */}
        {chainReaction.length > 1 && (
          <svg className="absolute inset-0 pointer-events-none">
            {chainReaction.slice(0, -1).map((reactorId, index) => {
                const currentReactor = displayedReactors.find(r => r.id === reactorId)
                const nextReactor = displayedReactors.find(r => r.id === chainReaction[index + 1])
              if (!currentReactor || !nextReactor) return null
              const x1 = currentReactor.x * 30 + 15
              const y1 = currentReactor.y * 30 + 15
              const x2 = nextReactor.x * 30 + 15
              const y2 = nextReactor.y * 30 + 15
              return (
                <motion.line
                  key={`${reactorId}-${chainReaction[index + 1]}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#chainGradient)"
                  strokeWidth="3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              )
            })}
            <defs>
              <linearGradient id="chainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#F97316" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>
        {/* Multi-trigger button - below the grid, above the card's bottom border */}
        <div className="flex justify-center mt-20 mb-[30px]">
          <button
            className={`px-8 py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white rounded-lg font-bold shadow-2xl shadow-orange-500/50 transition-all duration-300 transform hover:scale-110 active:scale-95 relative overflow-hidden ${
              selectedReactors.length > 0 && utcRoundInfo.phase === 'TRIGGER' 
                ? 'animate-pulse border-2 border-yellow-400' 
                : 'grayscale'
            }`}
            style={{ opacity: selectedReactors.length > 0 && utcRoundInfo.phase === 'TRIGGER' ? 1 : 0.5 }}
            disabled={selectedReactors.length === 0 || utcRoundInfo.phase !== 'TRIGGER'}
            onClick={handleMultiTrigger}
          >
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-red-400/20 animate-pulse"></div>
            <span className="relative z-10 text-lg">
              ⚡ TRIGGER SELECTED ({selectedReactors.length}) 💥
            </span>
          </button>
        </div>
        </div>
      </div>
      {/* Score Display is now moved to the parent page */}
    </>
  )
} 