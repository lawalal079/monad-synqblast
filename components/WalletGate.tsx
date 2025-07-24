'use client'

import React from 'react';
import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';

interface WalletGateProps {
  children: React.ReactNode;
}

export default function WalletGate({ children }: WalletGateProps) {
  const { isConnected } = useAccount();
  const { open } = useWeb3Modal();

  const handleConnectWallet = async () => {
    try {
      if (open) {
        await open();
      }
    } catch (error) {
      // Error opening wallet modal - fail silently
    }
  };

  if (isConnected) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="blur-sm pointer-events-none select-none">
        {children}
      </div>
      
      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="text-center p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-md mx-4">
          {/* Lock Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white/20">
              <svg 
                className="w-12 h-12 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-4">
            Connect Your Wallet
          </h2>
          
          {/* Description */}
          <p className="text-gray-300 mb-6 leading-relaxed">
            Connect your wallet to start playing Chain Reaction and earn rewards on Monad Testnet
          </p>
          
          {/* Connect Button */}
          <button
            onClick={handleConnectWallet}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
