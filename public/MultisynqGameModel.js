/**
 * Multisynq Game State Model for Monad Synqblast
 * Handles real-time synchronization of game state across all players
 */

class SynqBlastGameModel extends Multisynq.Model {
  init() {
    // Initialize game state
    this.reactors = new Map(); // Map of reactor positions and data
    this.currentPhase = 'DEPLOY';
    this.currentRound = 1;
    this.phaseStartTime = Date.now();
    this.leaderboard = [];
    this.connectedPlayers = new Set();
    this.gameEvents = [];
    
    // Subscribe to game events
    this.subscribe("game", "deployReactor", this.handleDeployReactor);
    this.subscribe("game", "triggerReactor", this.handleTriggerReactor);
    this.subscribe("game", "playerJoined", this.handlePlayerJoined);
    this.subscribe("game", "playerLeft", this.handlePlayerLeft);
    this.subscribe("game", "updateLeaderboard", this.handleUpdateLeaderboard);
    this.subscribe("game", "phaseChange", this.handlePhaseChange);
    
    // Start the game phase timer
    this.schedulePhaseChange();
  }

  // Handle reactor deployment from any player
  handleDeployReactor(data) {
    const { playerId, x, y, reactorType, energyLevel, txHash } = data;
    const reactorKey = `${x}-${y}`;
    
    this.reactors.set(reactorKey, {
      playerId,
      x,
      y,
      reactorType,
      energyLevel,
      txHash,
      deployedAt: Date.now(),
      round: this.currentRound,
      triggered: false
    });
    
    // Add to game events log
    this.gameEvents.push({
      type: 'REACTOR_DEPLOYED',
      playerId,
      x,
      y,
      reactorType,
      energyLevel,
      timestamp: Date.now(),
      round: this.currentRound
    });
    
    console.log(`Reactor deployed by ${playerId} at (${x}, ${y}) with ${energyLevel} energy`);
  }

  // Handle reactor triggering from any player
  handleTriggerReactor(data) {
    const { playerId, x, y, chainReactionData } = data;
    const reactorKey = `${x}-${y}`;
    
    if (this.reactors.has(reactorKey)) {
      const reactor = this.reactors.get(reactorKey);
      reactor.triggered = true;
      reactor.triggeredBy = playerId;
      reactor.triggeredAt = Date.now();
      reactor.chainReactionData = chainReactionData;
      
      this.reactors.set(reactorKey, reactor);
      
      // Add to game events log
      this.gameEvents.push({
        type: 'REACTOR_TRIGGERED',
        playerId,
        x,
        y,
        chainReactionData,
        timestamp: Date.now(),
        round: this.currentRound
      });
      
      console.log(`Reactor triggered by ${playerId} at (${x}, ${y})`);
    }
  }

  // Handle player joining the game
  handlePlayerJoined(data) {
    const { playerId, walletAddress } = data;
    this.connectedPlayers.add(playerId);
    
    this.gameEvents.push({
      type: 'PLAYER_JOINED',
      playerId,
      walletAddress,
      timestamp: Date.now()
    });
    
    console.log(`Player ${playerId} joined the game`);
  }

  // Handle player leaving the game
  handlePlayerLeft(data) {
    const { playerId } = data;
    this.connectedPlayers.delete(playerId);
    
    this.gameEvents.push({
      type: 'PLAYER_LEFT',
      playerId,
      timestamp: Date.now()
    });
    
    console.log(`Player ${playerId} left the game`);
  }

  // Handle leaderboard updates
  handleUpdateLeaderboard(data) {
    this.leaderboard = data.leaderboard;
    
    this.gameEvents.push({
      type: 'LEADERBOARD_UPDATED',
      timestamp: Date.now(),
      round: this.currentRound
    });
  }

  // Handle phase changes (Deploy -> Trigger -> Scoring)
  handlePhaseChange(data) {
    const { newPhase, round } = data;
    this.currentPhase = newPhase;
    this.currentRound = round || this.currentRound;
    this.phaseStartTime = Date.now();
    
    // Clear reactors when starting a new round
    if (newPhase === 'DEPLOY' && round > this.currentRound) {
      this.reactors.clear();
      this.currentRound = round;
    }
    
    this.gameEvents.push({
      type: 'PHASE_CHANGED',
      newPhase,
      round: this.currentRound,
      timestamp: Date.now()
    });
    
    console.log(`Phase changed to ${newPhase}, Round ${this.currentRound}`);
    
    // Schedule next phase change
    this.schedulePhaseChange();
  }

  // Schedule automatic phase changes
  schedulePhaseChange() {
    const phaseDurations = {
      'DEPLOY': 120000,   // 2 minutes
      'TRIGGER': 120000,  // 2 minutes
      'SCORING': 60000    // 1 minute
    };
    
    const currentDuration = phaseDurations[this.currentPhase] || 120000;
    
    this.future(currentDuration).autoPhaseChange();
  }

  // Automatic phase change
  autoPhaseChange() {
    let newPhase;
    let newRound = this.currentRound;
    
    switch (this.currentPhase) {
      case 'DEPLOY':
        newPhase = 'TRIGGER';
        break;
      case 'TRIGGER':
        newPhase = 'SCORING';
        break;
      case 'SCORING':
        newPhase = 'DEPLOY';
        newRound = this.currentRound + 1;
        break;
      default:
        newPhase = 'DEPLOY';
    }
    
    // Broadcast phase change to all clients
    this.handlePhaseChange({ newPhase, round: newRound });
  }

  // Get current game state for new players
  getGameState() {
    return {
      reactors: Array.from(this.reactors.entries()),
      currentPhase: this.currentPhase,
      currentRound: this.currentRound,
      phaseStartTime: this.phaseStartTime,
      leaderboard: this.leaderboard,
      connectedPlayers: Array.from(this.connectedPlayers),
      gameEvents: this.gameEvents.slice(-50) // Last 50 events
    };
  }

  // Get reactors for current round
  getCurrentRoundReactors() {
    const currentReactors = [];
    for (const [key, reactor] of this.reactors.entries()) {
      if (reactor.round === this.currentRound) {
        currentReactors.push(reactor);
      }
    }
    return currentReactors;
  }

  // Get phase time remaining
  getPhaseTimeRemaining() {
    const phaseDurations = {
      'DEPLOY': 120000,   // 2 minutes
      'TRIGGER': 120000,  // 2 minutes
      'SCORING': 60000    // 1 minute
    };
    
    const currentDuration = phaseDurations[this.currentPhase] || 120000;
    const elapsed = Date.now() - this.phaseStartTime;
    return Math.max(0, currentDuration - elapsed);
  }
}

// Register the model with Multisynq
SynqBlastGameModel.register("SynqBlastGameModel");

// Make it available globally
if (typeof window !== 'undefined') {
  window.SynqBlastGameModel = SynqBlastGameModel;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SynqBlastGameModel;
}
