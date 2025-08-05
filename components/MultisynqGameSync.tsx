'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';

// Context for sharing Multisynq state across components
const MultisynqContext = createContext<any>(null);

// Hook to use Multisynq in components
export const useMultisynq = () => {
  const context = useContext(MultisynqContext);
  return context;
};

interface MultisynqGameSyncProps {
  children: React.ReactNode;
  onGameStateUpdate?: (gameState: any) => void;
  onPlayerJoined?: (playerId: string) => void;
  onPlayerLeft?: (playerId: string) => void;
}

export default function MultisynqGameSync({
  children,
  onGameStateUpdate,
  onPlayerJoined,
  onPlayerLeft
}: MultisynqGameSyncProps) {
  const { address } = useAccount();
  const [multisynq, setMultisynq] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerCount, setPlayerCount] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [hasValidApiKey, setHasValidApiKey] = useState(false);
  const viewRef = useRef<any>(null);
  const modelRef = useRef<any>(null);

  useEffect(() => {
    const hideMultisynqUI = () => {
      // Hide Multisynq loading spinner overlay
      const spinnerOverlay = document.getElementById('multisynq_spinnerOverlay');
      if (spinnerOverlay) {
        spinnerOverlay.style.display = 'none';
      }
      
      // Hide any Multisynq connection status elements
      const connectionElements = document.querySelectorAll('[class*="multisynq"], [id*="multisynq"], [class*="croquet"], [id*="croquet"]');
      connectionElements.forEach(element => {
        if (element instanceof HTMLElement) {
          element.style.display = 'none';
        }
      });
      
      // Hide any loading or connection modals
      const modals = document.querySelectorAll('.multisynq_modal, .croquet_modal, .multisynq_connecting, .croquet_connecting');
      modals.forEach(modal => {
        if (modal instanceof HTMLElement) {
          modal.style.display = 'none';
        }
      });
    };

    // Initial hide
    hideMultisynqUI();

    // Set up observer to continuously hide any Multisynq UI elements
    const observer = new MutationObserver(hideMultisynqUI);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_MULTISYNQ_API_KEY;
    
    // Only initialize if API key is present
    if (!apiKey) {
      return;
    }

    const initializeMultisynq = async () => {
      // Only initialize if we have a valid API key from .env file
      if (!apiKey || apiKey === 'your_multisynq_api_key_here' || apiKey === 'demo-key') {
        setHasValidApiKey(false);
        return;
      }
      
      setHasValidApiKey(true);
      
      try {
        // Create a custom view class for our game
        class SynqBlastView extends window.Multisynq.View {
          constructor(model: any) {
            super(model);
            this.model = model;
            modelRef.current = model;
          }

          update() {
            super.update();
            const currentGameState = this.model.getGameState();
            
            // Trigger callbacks
            if (onGameStateUpdate) {
              onGameStateUpdate(currentGameState);
            }
          }
        }

        // Register the view
        SynqBlastView.viewName = "SynqBlastView";

        // Wait for model to be available
        if (!window.SynqBlastGameModel) {
          console.error('❌ SynqBlastGameModel not found on window object');
          return;
        }
        
        console.log('✅ SynqBlastGameModel found:', window.SynqBlastGameModel);
        
        // Start the Multisynq session (it returns a Promise)
        const multisynqSession = await window.Multisynq.Session.join({
          apiKey: apiKey,
          tps: 20,
          model: window.SynqBlastGameModel, // Use the actual model class
          view: SynqBlastView,
          name: window.Multisynq.App.autoSession(),
          password: window.Multisynq.App.autoPassword()
        });

        console.log('✅ Multisynq session joined successfully:', multisynqSession);
        console.log('🔍 Session object keys:', Object.keys(multisynqSession));
        console.log('🔍 Session prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(multisynqSession)));
        
        viewRef.current = multisynqSession;
        setMultisynq(multisynqSession);
        const sessionIdValue = multisynqSession.sessionId || multisynqSession.id;
        setSessionId(sessionIdValue);
        setIsConnected(true);
        
        // Always create session URL for sharing (regardless of QR widget)
        if (sessionIdValue) {
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('session', sessionIdValue);
          if (multisynqSession.password) {
            currentUrl.searchParams.set('password', multisynqSession.password);
          }
          
          const sessionUrlValue = currentUrl.toString();
          console.log('🔗 Session URL created:', sessionUrlValue);
          
          // Store session URL in component state and localStorage
          setSessionUrl(sessionUrlValue);
          localStorage.setItem('multisynq_session_url', sessionUrlValue);
          
          // Always create our own QR code since Multisynq's widget doesn't appear in our designated area
          console.log('🔍 Creating custom QR code for session:', sessionIdValue);
          createFallbackQRCode(sessionUrlValue);
          
          // Still try Multisynq's widget in case it works elsewhere
          if (window.Multisynq && window.Multisynq.App) {
            try {
              window.Multisynq.App.makeWidgetDock();
              console.log('🔍 Multisynq QR widget also attempted (may appear elsewhere)');
            } catch (error) {
              console.log('🔍 Multisynq QR widget failed:', error);
            }
          }
        }
        
        // Track player count - use single method to avoid double counting
        const updatePlayerCount = () => {
          let count = 1; // Default to 1 (this player)
          let method = 'default';
          
          console.log('🔍 Checking player count...');
          
          // Try Multisynq methods first
          if (typeof multisynqSession.userCount === 'number' && multisynqSession.userCount > 0) {
            count = multisynqSession.userCount;
            method = 'multisynq.userCount';
          } else if (typeof multisynqSession.viewCount === 'number' && multisynqSession.viewCount > 0) {
            count = multisynqSession.viewCount;
            method = 'multisynq.viewCount';
          } else if (multisynqSession.users && Array.isArray(multisynqSession.users) && multisynqSession.users.length > 0) {
            count = multisynqSession.users.length;
            method = 'multisynq.users.length';
          } else if (modelRef.current && modelRef.current.connectedPlayers && modelRef.current.connectedPlayers.size > 0) {
            count = modelRef.current.connectedPlayers.size;
            method = 'model.connectedPlayers';
          } else {
            // Fallback: use localStorage but ensure minimum of 1
            const sessionCount = parseInt(localStorage.getItem('multisynq_session_count') || '1');
            count = Math.max(1, sessionCount);
            method = 'localStorage';
          }
          
          // Ensure count is never 0 (at least this player exists)
          count = Math.max(1, count);
          
          console.log(`🎮 Player count: ${count} (method: ${method})`);
          setPlayerCount(count);
        };
        
        // Reset and set session count to 1 for this session (avoid stale counts)
        localStorage.setItem('multisynq_session_count', '1');
        console.log('🔍 Reset session count to 1 for new session');
        
        // Helper function to create fallback QR code
        const createFallbackQRCode = (url: string) => {
          const qrContainer = document.getElementById('qr-code-widget');
          if (qrContainer && url) {
            // Clear existing content
            qrContainer.innerHTML = '';
            
            // Create QR code using qr-server.com (free service)
            const qrSize = 120;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(url)}`;
            
            const qrImg = document.createElement('img');
            qrImg.src = qrUrl;
            qrImg.alt = 'Session QR Code';
            qrImg.className = 'w-full h-auto rounded';
            qrImg.style.maxWidth = `${qrSize}px`;
            qrImg.style.maxHeight = `${qrSize}px`;
            
            qrImg.onload = () => {
              console.log('✅ Fallback QR code generated successfully');
            };
            
            qrImg.onerror = () => {
              console.log('❌ Fallback QR code generation failed');
              qrContainer.innerHTML = '<div class="text-xs text-gray-500 p-2">QR code unavailable</div>';
            };
            
            qrContainer.appendChild(qrImg);
          }
        };
        
        // Initial player count
        updatePlayerCount();
        
        // Listen for player events
        if (multisynqSession.on) {
          multisynqSession.on('playerJoined', updatePlayerCount);
          multisynqSession.on('playerLeft', updatePlayerCount);
          multisynqSession.on('userJoined', updatePlayerCount);
          multisynqSession.on('userLeft', updatePlayerCount);
        }
        
        // Also try to update periodically
        const playerCountInterval = setInterval(updatePlayerCount, 5000);
        
        // Listen for storage changes from other tabs
        const handleStorageChange = (e: StorageEvent) => {
          if (e.key === 'multisynq_session_count') {
            updatePlayerCount();
          }
        };
        window.addEventListener('storage', handleStorageChange);
        
        // Cleanup function
        const cleanup = () => {
          clearInterval(playerCountInterval);
          window.removeEventListener('storage', handleStorageChange);
          
          // Decrement session count when tab closes
          const currentCount = parseInt(localStorage.getItem('multisynq_session_count') || '1');
          localStorage.setItem('multisynq_session_count', Math.max(0, currentCount - 1).toString());
          console.log('🔍 Decremented session count to:', Math.max(0, currentCount - 1));
        };
        
        // Handle page unload
        window.addEventListener('beforeunload', cleanup);
        
        return cleanup;

      } catch (error) {
        // Silent error handling - no console logs
      }
    };

    // Store cleanup functions
    let cleanupFunctions: (() => void)[] = [];

    // Load Multisynq library and initialize
    if (typeof window !== 'undefined' && !window.Multisynq) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@multisynq/client@latest/bundled/multisynq-client.min.js';
      script.onload = () => {
        // Load our game model from public folder
        const modelScript = document.createElement('script');
        modelScript.src = '/MultisynqGameModel.js';
        modelScript.onload = async () => {
          const cleanup = await initializeMultisynq();
          if (cleanup) {
            cleanupFunctions.push(cleanup);
          }
        };
        document.head.appendChild(modelScript);
      };
      document.head.appendChild(script);
    } else if (window.Multisynq) {
      initializeMultisynq().then(cleanup => {
        if (cleanup) {
          cleanupFunctions.push(cleanup);
        }
      });
    }

    // Cleanup on unmount
    return () => {
      // Run all cleanup functions
      cleanupFunctions.forEach(cleanup => cleanup());
      
      if (multisynq && address) {
        // Silent cleanup
      }
      if (viewRef.current) {
        // Silent cleanup
      }
    };
  }, []);

  // Helper function to publish events to other players
  const publishEvent = (eventType: string, data: any) => {
    if (viewRef.current && viewRef.current.publish) {
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

    // Update leaderboard
    updateLeaderboard: (leaderboard: any[]) => {
      publishEvent("updateLeaderboard", { leaderboard });
    },

    // Change game phase
    changePhase: (newPhase: string, round: number) => {
      publishEvent("phaseChange", { newPhase, round });
    },

    // Get current game state
    getGameState: () => null,

    // Get connected players
    getConnectedPlayers: () => [],

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
      {children}
      
      {/* Show useful Multisynq features when connected (but hide loading/intrusive UI) */}
      {hasValidApiKey && isConnected && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-green-400 text-sm font-medium mb-2">
              🔗 Multiplayer Connected
            </div>
            <div className="text-green-300 text-xs mb-2">
              Players: {playerCount}
            </div>
            {sessionId && (
              <div className="mt-2">
                <div className="text-green-300 text-xs mb-1">Share Session:</div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="flex-1 text-purple-600 hover:text-purple-800 font-medium text-center py-1 px-2 bg-purple-50 rounded cursor-pointer"
                  >
                    📱 Scan QR
                  </button>
                  <button
                    onClick={() => {
                      if (sessionUrl) {
                        navigator.clipboard.writeText(sessionUrl).then(() => {
                          console.log('📋 Session URL copied to clipboard');
                          // Brief visual feedback
                          const btn = event?.target as HTMLButtonElement;
                          if (btn) {
                            const originalText = btn.textContent;
                            btn.textContent = '✅ Copied!';
                            setTimeout(() => {
                              btn.textContent = originalText;
                            }, 1500);
                          }
                        }).catch(err => {
                          console.error('Failed to copy URL:', err);
                        });
                      }
                    }}
                    className="flex-1 text-green-600 hover:text-green-800 font-medium text-center py-1 px-2 bg-green-50 rounded cursor-pointer"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* QR Code Modal */}
    {showQRModal && sessionUrl && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowQRModal(false)}
        ></div>
        
        {/* Modal Content */}
        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 max-w-sm mx-4 shadow-2xl border border-cyan-500/30">
          {/* Close Button */}
          <button
            onClick={() => setShowQRModal(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700/50"
          >
            ×
          </button>
          
          {/* Modal Header */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-cyan-400 mb-1">Join Multiplayer Session</h3>
            <p className="text-sm text-gray-300">Scan QR code or copy the link</p>
          </div>
          
          {/* QR Code */}
          <div className="flex justify-center mb-4">
            <div id="modal-qr-code" className="bg-white p-4 rounded-lg shadow-lg">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sessionUrl)}`}
                alt="Session QR Code"
                className="w-48 h-48 rounded"
                onLoad={() => console.log('✅ Modal QR code loaded successfully')}
                onError={() => console.log('❌ Modal QR code failed to load')}
              />
            </div>
          </div>
          
          {/* Session URL */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-cyan-400 mb-2">Session Link:</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={sessionUrl || ''} 
                readOnly 
                className="flex-1 px-3 py-2 border border-slate-600 rounded text-xs font-mono bg-slate-700 text-gray-200 focus:outline-none focus:border-cyan-500"
                style={{ fontSize: '10px' }}
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (sessionUrl) {
                    navigator.clipboard.writeText(sessionUrl).then(() => {
                      console.log('📋 Session URL copied from modal');
                      // Brief visual feedback
                      const btn = e.target as HTMLButtonElement;
                      if (btn) {
                        const originalText = btn.textContent;
                        btn.textContent = '✅';
                        btn.className = 'px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium';
                        setTimeout(() => {
                          btn.textContent = originalText;
                          btn.className = 'px-3 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 text-sm font-medium';
                        }, 1500);
                      }
                    }).catch(err => {
                      console.error('Failed to copy URL:', err);
                    });
                  }
                }}
                className="px-3 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 text-sm font-medium"
              >
                📋 Copy
              </button>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="text-xs text-gray-400 text-center">
            <p>📱 Scan with your phone camera</p>
            <p>🔗 Or copy and share the link</p>
          </div>
        </div>
      </div>
    )}
    
    {/* Hide all Multisynq loading and connection UI */}
    <div id="multisynq-ui-hider"></div>
  </MultisynqContext.Provider>
  );
};
