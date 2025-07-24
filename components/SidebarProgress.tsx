import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, usePublicClient } from 'wagmi';
import ChainReactionGameABI from '../artifacts/contracts/ChainReactionGame.sol/ChainReactionGame.json';

const ROLES = [
  { name: 'Novice', min: 0 },
  { name: 'Beginner', min: 1000 },
  { name: 'Intermediate', min: 5000 },
  { name: 'Skilled', min: 10000 },
  { name: 'Advanced', min: 20000 },
  { name: 'Expert', min: 50000 },
  { name: 'Master', min: 70000 },
  { name: 'Legendary', min: 100000 },
];

function getRank(score: number) {
  for (let i = ROLES.length - 1; i >= 0; i--) {
    if (score >= ROLES[i].min) return ROLES[i].name;
  }
  return ROLES[0].name;
}

export default function SidebarProgress() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchScore = async () => {
      if (!address || !publicClient) return;
      try {
        const playerScore = await publicClient.readContract({
          address: process.env.NEXT_PUBLIC_CHAIN_REACTION_GAME_ADDRESS as `0x${string}`,
          abi: ChainReactionGameABI.abi,
          functionName: 'playerScore',
          args: [address],
        });
        setScore(Number(playerScore) / 1e18);
      } catch {
        setScore(0);
      }
    };
    fetchScore();
  }, [address, publicClient]);

  const currentRole = getRank(score);

  return (
    <div className="game-card">
      <h3 className="text-lg font-semibold mb-4 text-gradient">Your Progress</h3>
      <div className="space-y-4">
        <div className="text-center">
          <div className="score-display mb-2">{score.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-sm text-gray-400">Total Score</div>
        </div>
        <div className="text-center">
          <button
            className="text-lg font-semibold text-monad-purple mb-1 underline hover:text-purple-400 transition-colors cursor-pointer"
            onClick={() => setShowModal(true)}
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            {currentRole}
          </button>
          <div className="text-xs text-gray-400">Current Role</div>
        </div>
      </div>
      {showModal && typeof document !== 'undefined' && createPortal(
        <>
          {/* Overlay that renders directly to document.body */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm" 
            style={{ zIndex: 9999 }}
            onClick={() => setShowModal(false)}
          />
          <div 
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
            style={{ zIndex: 10000 }}
          >
            <div className="relative bg-gradient-to-br from-gray-900 via-blue-900/30 to-purple-900/30 backdrop-blur-md rounded-2xl p-8 w-96 border-2 border-cyan-400 shadow-2xl shadow-cyan-500/30">
              {/* Animated background overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-pulse rounded-2xl"></div>
              
              {/* Close button */}
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-cyan-400 text-2xl font-bold transition-colors z-10"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
              
              {/* Content */}
              <div className="relative z-10">
                <h4 className="text-2xl font-black mb-6 text-center">
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    🏆 ROLES & POINTS
                  </span>
                </h4>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {ROLES.map((role) => {
                    const achieved = score >= role.min;
                    const isCurrent = currentRole === role.name;
                    return (
                      <div
                        key={role.name}
                        className={`flex justify-between items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                          isCurrent 
                            ? 'bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-400 shadow-lg shadow-cyan-500/20' 
                            : achieved
                            ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30'
                            : 'bg-gray-800/50 border border-gray-600/30'
                        }`}
                      >
                        <span className={`font-bold text-lg ${
                          isCurrent 
                            ? 'text-cyan-300' 
                            : achieved 
                            ? 'text-green-400' 
                            : 'text-gray-400'
                        }`}>
                          {role.name}
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          {isCurrent ? (
                            <>
                              <span className="text-cyan-400 text-xl font-bold animate-pulse">★</span>
                              <span className="text-cyan-300 font-semibold">CURRENT</span>
                            </>
                          ) : achieved ? (
                            <>
                              <span className="text-green-400 text-lg font-bold">✓</span>
                              <span className="text-green-300 text-sm font-medium">ACHIEVED</span>
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm font-medium">
                              {role.min.toLocaleString()}+ pts
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Current progress indicator */}
                <div className="mt-6 pt-4 border-t border-cyan-400/30">
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">Your Score</div>
                    <div className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                      {score.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}