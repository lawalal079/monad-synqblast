'use client'

import React, { useEffect } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';

export default function WalletConnect() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {

  }, [open, address, isConnected]);

  const handleConnect = async () => {

    
    try {
      if (open) {
        await open();
      } else {
        // Web3Modal open function is not available - fail silently
      }
    } catch (error) {
      // Error opening Web3Modal - fail silently
    }
  };

  const handleDisconnect = () => {
    try {
      disconnect();
    } catch (error) {
      // Error disconnecting wallet - fail silently
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 border border-white/20" style={{ height: '67px', display: 'flex', alignItems: 'center' }}>
      {!isConnected ? (
        <button 
          className="px-4 py-2 bg-monad-blue hover:bg-monad-purple text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 text-xl" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            handleConnect();
          }}
          style={{ pointerEvents: 'auto' }}
        >
          Connect Wallet
        </button>
      ) : (
        <div className="flex items-center space-x-3">
          <button
            className="font-mono text-xl text-white hover:text-blue-300 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              if (open) open();
            }}
            title="Click to view wallet details"
            style={{ pointerEvents: 'auto' }}
          >
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </button>
          <button 
            className="px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              handleDisconnect();
            }}
            style={{ pointerEvents: 'auto' }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}