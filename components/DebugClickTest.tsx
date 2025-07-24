'use client'

import React, { useState } from 'react';

export default function DebugClickTest() {
  const [clickCount, setClickCount] = useState(0);
  const [lastClick, setLastClick] = useState<string>('');

  const handleClick = (buttonName: string) => {

    setClickCount(prev => prev + 1);
    setLastClick(buttonName);
  };

  return (
    <div className="game-card">
      <h3 className="text-lg font-semibold mb-4 text-gradient">Click Debug Test</h3>
      <div className="space-y-4">
        <p className="text-sm text-gray-300">
          Click Count: {clickCount} | Last: {lastClick}
        </p>
        
        <button 
          className="game-button w-full"
          onClick={() => handleClick('Button 1')}
          style={{ pointerEvents: 'auto' }}
        >
          Test Button 1
        </button>
        
        <button 
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded w-full"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClick('Button 2');
          }}
          style={{ pointerEvents: 'auto' }}
        >
          Test Button 2
        </button>
        
        <div 
          className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer text-center"
          onClick={() => handleClick('Div Click')}
          style={{ pointerEvents: 'auto' }}
        >
          Clickable Div
        </div>
      </div>
    </div>
  );
}
