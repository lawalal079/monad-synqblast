'use client'

import React from 'react';
import { useAccount } from 'wagmi';
import WalletConnect from './WalletConnect';

export default function ConditionalWalletConnect() {
  const { isConnected } = useAccount();

  // Only render WalletConnect in header when wallet is connected
  if (!isConnected) {
    return null;
  }

  return (
    <div className="absolute z-20" style={{ top: '36px', right: '16px' }}>
      <WalletConnect />
    </div>
  );
}
