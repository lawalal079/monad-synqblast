"use client";

import React, { useEffect, useState } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { walletConnect, injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "default_project_id";

const monadTestnet = {
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID),
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL!] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://explorer.testnet.monad.xyz" },
  },
  testnet: true,
} as const;

const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({ projectId, showQrModal: false }),
  ],
  transports: {
    [monadTestnet.id]: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL!),
  },
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [web3ModalReady, setWeb3ModalReady] = useState(false);

  useEffect(() => {
    // Initialize Web3Modal only after component mounts on client
    setIsClient(true);
    
    const initWeb3Modal = async () => {
      try {
        const { createWeb3Modal } = await import("@web3modal/wagmi/react");
        
        createWeb3Modal({
          wagmiConfig,
          projectId,
          enableAnalytics: false,
          themeMode: 'dark',
          themeVariables: {
            '--w3m-font-family': 'Inter, sans-serif',
            '--w3m-accent': '#3b82f6',
          }
        });
        
        console.log('Web3Modal initialized successfully');
        setWeb3ModalReady(true);
      } catch (error) {
        console.error('Error initializing Web3Modal:', error);
        // Set ready anyway to prevent infinite loading
        setWeb3ModalReady(true);
      }
    };

    initWeb3Modal();
  }, []);

  // Don't render children until Web3Modal is initialized on client
  // But don't show loading UI since splash screen handles it
  if (!isClient || !web3ModalReady) {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {/* No loading UI here - splash screen handles it */}
          <div style={{ display: 'none' }}></div>
        </WagmiProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
    </QueryClientProvider>
  );
}