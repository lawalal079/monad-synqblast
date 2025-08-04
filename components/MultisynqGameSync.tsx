'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';

// Multisynq integration types
declare global {
  interface Window {
    Multisynq: any;
    SynqBlastGameModel: any;
  }
}

interface MultisynqGameSyncProps {
  onGameStateUpdate?: (gameState: any) => void;
  onReactorDeployed?: (reactor: any) => void;
  onReactorTriggered?: (reactor: any) => void;
  onPhaseChange?: (phase: string, round: number) => void;
  onLeaderboardUpdate?: (leaderboard: any[]) => void;
  children?: React.ReactNode;
}

export default function MultisynqGameSync({
  onGameStateUpdate,
  onReactorDeployed,
  onReactorTriggered,
  onPhaseChange,
  onLeaderboardUpdate,
  children
}: MultisynqGameSyncProps) {
  const { address } = useAccount();
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [hasValidApiKey, setHasValidApiKey] = useState(false);
  const viewRef = useRef<any>(null);
  const modelRef = useRef<any>(null);

  // Initialize Multisynq when component mounts
  useEffect(() => {
    const initializeMultisynq = async () => {
      // Only initialize if we have a valid API key from .env file
      const apiKey = process.env.NEXT_PUBLIC_MULTISYNQ_API_KEY;
      if (!apiKey || apiKey === 'your_multisynq_api_key_here' || apiKey === 'demo-key') {
        console.log('🎮 Multisynq: No valid API key found in .env file - multiplayer disabled');
        setHasValidApiKey(false);
        return;
      }
      
      setHasValidApiKey(true);
      
      // Wait for Multisynq to be available
      if (typeof window !== 'undefined' && window.Multisynq) {
        try {
          // Create the view class
          class SynqBlastGameView extends window.Multisynq.View {
            constructor(model: any) {
              super(model);
              this.model = model;
              modelRef.current = model;
            }

            update() {
              super.update();
              const currentGameState = this.model.getGameState();
              setGameState(currentGameState);
              
              // Trigger callbacks
              if (onGameStateUpdate) {
                onGameStateUpdate(currentGameState);
              }

              // Check for phase changes
              if (onPhaseChange) {
                onPhaseChange(this.model.currentPhase, this.model.currentRound);
              }

              // Check for leaderboard updates
              if (onLeaderboardUpdate && this.model.leaderboard) {
                onLeaderboardUpdate(this.model.leaderboard);
              }
            }

            detach() {
              super.detach();
              modelRef.current = null;
            }
          }

          // Show QR code widget for easy sharing
          window.Multisynq.App.makeWidgetDock();

          // Join Multisynq session with validated API key
          const multisynqSession = await window.Multisynq.Session.join({
            apiKey: apiKey, // Validated API key from .env file
            appId: "com.monad.synqblast", // Unique app ID
            model: window.SynqBlastGameModel, // Our game model
            view: SynqBlastGameView, // Our view class
            name: window.Multisynq.App.autoSession(), // Auto session name from URL
            password: window.Multisynq.App.autoPassword() // Auto password from URL
          });

          setSession(multisynqSession);
          setIsConnected(true);
          
          console.log("🎮 Multisynq session joined:", multisynqSession.id);

          // Notify that player joined if wallet is connected
          if (address) {
            publishEvent("playerJoined", {
              playerId: address,
              walletAddress: address
            });
          }

        } catch (error) {
          console.error("Failed to initialize Multisynq:", error);
        }
      }
    };

    // Load Multisynq script if not already loaded
    if (!window.Multisynq) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@multisynq/client@latest/bundled/multisynq-client.min.js';
      script.onload = () => {
        // Load our game model
        const modelScript = document.createElement('script');
        modelScript.src = '/components/MultisynqGameModel.js';
        modelScript.onload = initializeMultisynq;
        document.head.appendChild(modelScript);
      };
      document.head.appendChild(script);
    } else {
      initializeMultisynq();
    }

    // Cleanup on unmount
    return () => {
      if (session && address) {
        publishEvent("playerLeft", { playerId: address });
      }
      if (viewRef.current) {
        viewRef.current.detach();
      }
    };
  }, []);

  // Publish events to Multisynq
  const publishEvent = (eventType: string, data: any) => {
    if (viewRef.current) {
      viewRef.current.publish("game", eventType, data);
    }
  };

  // Public methods for game components to use
  const multisynqAPI = {
    // Deploy a reactor and sync with all players
    deployReactor: (x: number, y: number, reactorType: string, energyLevel: number, txHash: string) => {
      if (address) {
        publishEvent("deployReactor", {
          playerId: address,
          x,
          y,
          reactorType,
          energyLevel,
          txHash
        });
      }
    },

    // Trigger a reactor and sync with all players
    triggerReactor: (x: number, y: number, chainReactionData: any) => {
      if (address) {
        publishEvent("triggerReactor", {
          playerId: address,
          x,
          y,
          chainReactionData
        });
      }
    },

    // Update leaderboard for all players
    updateLeaderboard: (leaderboard: any[]) => {
      publishEvent("updateLeaderboard", { leaderboard });
    },

    // Force phase change (admin function)
    changePhase: (newPhase: string, round?: number) => {
      publishEvent("phaseChange", { newPhase, round });
    },

    // Get current game state
    getGameState: () => gameState,

    // Get connected players
    getConnectedPlayers: () => gameState?.connectedPlayers || [],

    // Get current round reactors
    getCurrentRoundReactors: () => {
      if (modelRef.current) {
        return modelRef.current.getCurrentRoundReactors();
      }
      return [];
    },

    // Get phase time remaining
    getPhaseTimeRemaining: () => {
      if (modelRef.current) {
        return modelRef.current.getPhaseTimeRemaining();
      }
      return 0;
    }
  };

  // Provide the API to child components
  return (
    <MultisynqContext.Provider value={multisynqAPI}>
      <div className="multisynq-game-container">
        {/* Only show connection status when we have a valid API key */}
        {hasValidApiKey && (
          <>
            {/* Connection Status */}
            <div className="fixed top-4 right-4 z-50">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isConnected 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                {isConnected ? '🔗 Multiplayer Connected' : '⏳ Connecting...'}
              </div>
            </div>

            {/* Player Count */}
            {gameState?.connectedPlayers && (
              <div className="fixed top-16 right-4 z-50">
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  👥 {gameState.connectedPlayers.length} Player{gameState.connectedPlayers.length !== 1 ? 's' : ''} Online
                </div>
              </div>
            )}
          </>
        )}

        {children}
      </div>
    </MultisynqContext.Provider>
  );
}

// Create React Context for Multisynq API
const MultisynqContext = React.createContext<any>(null);

// Hook to use Multisynq in other components
export function useMultisynq() {
  const context = React.useContext(MultisynqContext);
  if (!context) {
    throw new Error('useMultisynq must be used within MultisynqGameSync');
  }
  return context;
}
