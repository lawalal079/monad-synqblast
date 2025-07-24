'use client'

import React, { useState, useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import './hexagon.css';
import Providers from './providers';
import ReactorControls from '../components/ReactorControls';
import SidebarProgress from '../components/SidebarProgress';
import WalletConnect from '../components/WalletConnect';
import HeaderStats from '../components/HeaderStats';
import Leaderboard from '../components/Leaderboard';
import WalletGate from '../components/WalletGate';
import ConditionalWalletConnect from '../components/ConditionalWalletConnect';
import SplashScreen from '../components/SplashScreen';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [currentPhase, setCurrentPhase] = useState('DEPLOY');
  const [isLoading, setIsLoading] = useState(true);

  // Get current phase from UTC time
  useEffect(() => {
    const getCurrentPhase = () => {
      const now = new Date();
      const utcHours = now.getUTCHours();
      const utcMinutes = now.getUTCMinutes();
      const utcSeconds = now.getUTCSeconds();
      const secondsSinceMidnight = utcHours * 3600 + utcMinutes * 60 + utcSeconds;
      const roundDuration = 5 * 60; // 5 minutes
      const secondsIntoRound = secondsSinceMidnight % roundDuration;
      if (secondsIntoRound < 2 * 60) return 'DEPLOY';
      if (secondsIntoRound < 4 * 60) return 'TRIGGER';
      return 'SCORING';
    };
    setCurrentPhase(getCurrentPhase());
    const interval = setInterval(() => {
      setCurrentPhase(getCurrentPhase());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <html lang="en">
      <head>
        <title>Monad Synqblast</title>
        <meta name="description" content="Deploy reactors and trigger chain reactions in this blockchain-powered strategy game" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body className={`${inter.className} bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white`}>
        {/* Splash Screen - Outside Providers for immediate display */}
        {isLoading && (
          <SplashScreen onLoadingComplete={handleLoadingComplete} />
        )}
        
        {/* Main App Content - Only show when not loading */}
        {!isLoading && (
          <Providers>
          {/* Header and stats */}
          <header className="relative overflow-hidden border-b-2 border-cyan-400 shadow-2xl shadow-cyan-500/20">
            {/* Animated background with multiple layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/40 to-purple-900/40"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
            {/* Animated particles effect */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-10 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
              <div className="absolute top-20 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
              <div className="absolute bottom-10 left-1/4 w-1 h-1 bg-pink-400 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
              <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
            </div>
            <div className="relative z-10 container mx-auto px-4 py-12">
              {/* Wallet connection positioned absolutely in top right - only show when connected */}
              <ConditionalWalletConnect />
              <div className="text-center">
                <h1 className="text-7xl font-black mb-6 relative">
                  <span className="relative bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl">
                    SYNQBLAST
                  </span>
                  
                  {/* Glowing overlay matching splash screen */}
                  <span 
                    className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent opacity-50 animate-pulse"
                    style={{ filter: 'blur(4px)' }}
                  >
                    SYNQBLAST
                  </span>
                  {/* Enhanced 3D glowing effect behind text */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 blur-xl -z-10 animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20 blur-2xl -z-20"></div>
                </h1>
                <p className="text-2xl text-cyan-300 mb-8 font-semibold drop-shadow-lg">
                  🚀 Create spectacular chain reactions on <span className="text-purple-400 font-bold">Monad Testnet</span> 💥
                </p>
                <HeaderStats />
              </div>
            </div>
          </header>
          {/* Main layout grid with gaming effects */}
          <main className="container mx-auto px-4 py-8 relative">
            {/* Animated background particles for main content */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-20 left-10 w-1 h-1 bg-cyan-400 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
              <div className="absolute top-40 right-10 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '4s'}}></div>
              <div className="absolute bottom-20 left-1/3 w-1 h-1 bg-pink-400 rounded-full animate-ping" style={{animationDelay: '5s'}}></div>
            </div>
            <WalletGate>
              {/* FUTURISTIC HEXAGONAL GAMING INTERFACE */}
              <div className="relative min-h-screen">
                
                {/* Floating Hexagonal HUD Elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  {/* Animated hexagonal grid background */}
                  <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <pattern id="hexPattern" x="0" y="0" width="10" height="8.66" patternUnits="userSpaceOnUse">
                          <polygon points="5,0 9.33,2.5 9.33,7.5 5,10 0.67,7.5 0.67,2.5" fill="none" stroke="cyan" strokeWidth="0.1" opacity="0.3"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#hexPattern)" className="animate-pulse"/>
                    </svg>
                  </div>
                </div>



                {/* Main Game Area - Centered Focus */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                  
                  {/* Left Control Panel */}
                  <div className="xl:col-span-1 space-y-6">
                    <ReactorControls 
                      isConnected={true} 
                      currentPhase={currentPhase}
                    />
                    
                    {/* Your Progress Pod - Moved from header */}
                    <div className="relative pointer-events-auto">
                      <div className="bg-gradient-to-br from-gray-900/90 via-cyan-900/20 to-blue-900/20 backdrop-blur-sm rounded-lg p-6 border-2 border-cyan-400 shadow-2xl shadow-cyan-500/20 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 animate-pulse"></div>
                        <div className="relative z-10">
                          <SidebarProgress />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Central Game Board - Hero Section */}
                  <div className="xl:col-span-3">
                    <div className="relative">
                      {/* Game board with enhanced focus */}
                      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-8 border-4 border-cyan-400 shadow-2xl shadow-cyan-500/30">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 animate-pulse rounded-2xl"></div>
                        <div className="relative z-10">
                          {children}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Info Panel */}
                  <div className="xl:col-span-1 space-y-6">
                    <Leaderboard />
                    
                    {/* Game Tips Panel */}
                    <div className="relative bg-gradient-to-br from-gray-900/90 via-yellow-900/20 to-orange-900/20 backdrop-blur-sm rounded-lg p-4 border-2 border-yellow-400 shadow-2xl shadow-yellow-500/20 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 animate-pulse"></div>
                      <div className="relative z-10">
                        <h3 className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-3">
                          💡 GAME TIPS
                        </h3>
                        <div className="space-y-2 text-sm text-gray-300">
                          <div className="flex items-center space-x-2">
                            <span className="text-green-400">•</span>
                            <span>Deploy reactors strategically</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-400">•</span>
                            <span>Chain reactions = more points</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-purple-400">•</span>
                            <span>Higher energy = bigger impact</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </WalletGate>
          </main>
          </Providers>
        )}
      </body>
    </html>
  );
} 