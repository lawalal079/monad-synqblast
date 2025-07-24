// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ChainReactionGame
 * @dev A game that demonstrates Multisynq capabilities through chain reactions
 * Players deploy reactors that can trigger other reactors, creating cascading effects
 */
contract ChainReactionGame is Ownable, ReentrancyGuard {
    
    enum ReactorType { Ultra, High, Medium, Low }
    
    struct Reactor {
        uint256 id;
        address owner;
        uint256 x;
        uint256 y;
        ReactorType rType;
        uint256 energy;
        bool isActive;
        uint256 points;
    }
    
    struct ChainReaction {
        uint256 id;
        uint256[] reactorIds;
        uint256 timestamp;
        uint256 totalEnergy;
        uint256 chainLength;
    }
    
    // Game state
    uint256 public nextReactorId = 1;
    uint256 public nextChainReactionId = 1;
    uint256 public gameStartTime;
    uint256 public constant ROUND_DURATION = 5 minutes;
    uint256 public constant DEPLOY_PHASE_DURATION = 2 minutes;
    uint256 public constant TRIGGER_PHASE_DURATION = 2 minutes;
    uint256 public constant SCORING_PHASE_DURATION = 1 minutes;
    uint256 public constant TRIGGER_COOLDOWN = 30 seconds;
    uint256 public constant MAX_ENERGY = 10; // Max 10 energy per reactor (10 reactors × 10 energy = 100 total)
    uint256 public constant STARTING_POINTS = 500e18; // 500 points with 18 decimals
    uint256 public constant MINIMUM_POINTS = 100;
    uint256 public constant MAX_REACTORS_PER_ROUND = 10;
    
    // Mappings
    mapping(uint256 => Reactor) public reactors;
    mapping(uint256 => ChainReaction) public chainReactions;
    mapping(address => uint256[]) public playerReactors;
    address[] public allPlayers;
    mapping(address => bool) public isPlayer;
    mapping(address => uint256) public playerScore;
    mapping(address => uint256) public lastRoundPoints;
    mapping(address => uint256) public roundsParticipated;
    uint256 public globalRoundStartTime;
    uint256 public currentRoundNumber;
    uint256 public lastBoardResetRound = 0;
    uint256 public season = 1;
    uint256 public seasonStartTime;
    uint256 public constant SEASON_DURATION = 60 days; // 2 months
    mapping(address => mapping(uint256 => uint256)) public reactorsDeployedThisRound;
    mapping(address => uint256) public lastClaimedSeason;
    
    // Events
    event ReactorDeployed(uint256 indexed reactorId, address indexed owner, uint256 x, uint256 y, uint256 energy);
    event ReactorTriggered(uint256 indexed reactorId, uint256 energy, uint256 chainReactionId);
    event ChainReactionCreated(uint256 indexed chainReactionId, uint256[] reactorIds, uint256 totalEnergy);
    event PointsEarned(address indexed player, uint256 points, uint256 totalScore);
    event RoundStarted(uint256 roundNumber, uint256 startTime);
    event RoundEnded(uint256 roundNumber, uint256 endTime);
    event PhaseChanged(string phase, uint256 timestamp);
    event PlayerJoined(address indexed player, uint256 startingPoints);
    
    constructor() Ownable(msg.sender) {
        gameStartTime = block.timestamp;
        globalRoundStartTime = block.timestamp;
        currentRoundNumber = 1;
        seasonStartTime = block.timestamp;
    }
    
    function _addPlayer(address player) internal {
        if (!isPlayer[player]) {
            allPlayers.push(player);
            isPlayer[player] = true;
            playerScore[player] = STARTING_POINTS;
            roundsParticipated[player] = 0;
            lastRoundPoints[player] = 0;
            emit PlayerJoined(player, STARTING_POINTS);
        }
    }

    function getDeployFee(ReactorType rType) public pure returns (uint256) {
        if (rType == ReactorType.Ultra) return 1e18;      // 1 point (use 1e18 for decimals)
        if (rType == ReactorType.High) return 75e16;      // 0.75 point
        if (rType == ReactorType.Medium) return 5e17;     // 0.5 point
        if (rType == ReactorType.Low) return 25e15;       // 0.25 point
        return 0;
    }

    function getCurrentUtcRound() public view returns (uint256) {
        uint256 secondsSinceMidnight = (block.timestamp % 1 days);
        return (secondsSinceMidnight / 300) + 1; // 5 min rounds, 1-based
    }

    function _autoResetBoardIfNeeded() internal {
        // Use proper UTC-based round calculation
        uint256 secondsSinceMidnight = (block.timestamp % 1 days);
        uint256 currentRound = (secondsSinceMidnight / ROUND_DURATION) + 1;
        if (currentRound > lastBoardResetRound) {
            // Clear all reactors
            for (uint256 i = 1; i < nextReactorId; i++) {
                delete reactors[i];
            }
            nextReactorId = 1;
            // Reset per-round counters
            for (uint256 i = 0; i < allPlayers.length; i++) {
                address player = allPlayers[i];
                reactorsDeployedThisRound[player][currentRound] = 0;
            }
            lastBoardResetRound = currentRound;
        }
    }

    // Call this at the start of any state-changing function
    function _autoResetSeasonIfNeeded() internal {
        if (block.timestamp >= seasonStartTime + SEASON_DURATION) {
            season++;
            seasonStartTime = block.timestamp;
            // Reset all player stats and give 500 points to EVERY player
            for (uint256 i = 0; i < allPlayers.length; i++) {
                address player = allPlayers[i];
                playerScore[player] = STARTING_POINTS; // Give 500 points to every player
                roundsParticipated[player] = 0;
                lastRoundPoints[player] = 0;
                emit PlayerJoined(player, STARTING_POINTS); // Emit event for each player
            }
        }
    }
    
    /**
     * @dev Deploy a new reactor at specified coordinates
     * @param x X coordinate on the game board
     * @param y Y coordinate on the game board
     * @param energy Initial energy level
     */
    function deployReactor(uint256 x, uint256 y, ReactorType rType, uint256 energy) external {
        _deployReactorInternal(x, y, rType, energy, msg.sender);
    }

    /**
     * @dev Internal function to deploy a reactor
     * @param x X coordinate on the game board
     * @param y Y coordinate on the game board
     * @param rType Reactor type
     * @param energy Initial energy level
     * @param player The address to deploy for
     */
    function _deployReactorInternal(uint256 x, uint256 y, ReactorType rType, uint256 energy, address player) internal {
        _autoResetBoardIfNeeded();
        _autoResetSeasonIfNeeded();
        require(energy > 0 && energy <= MAX_ENERGY, "Invalid energy level");
        // Use proper UTC-based phase check
        uint256 secondsSinceMidnight = (block.timestamp % 1 days);
        uint256 roundTime = secondsSinceMidnight % ROUND_DURATION;
        require(roundTime < DEPLOY_PHASE_DURATION, "Deploy phase has ended");
        uint256 roundNum = (secondsSinceMidnight / ROUND_DURATION) + 1;
        require(reactorsDeployedThisRound[player][roundNum] < MAX_REACTORS_PER_ROUND, "Max reactors deployed this round");
        // Welcome bonus for new player
        if (!isPlayer[player]) {
            allPlayers.push(player);
            isPlayer[player] = true;
            playerScore[player] = STARTING_POINTS; // Changed from WELCOME_BONUS to STARTING_POINTS
            roundsParticipated[player] = 0;
            lastRoundPoints[player] = 0;
            emit PlayerJoined(player, STARTING_POINTS);
        }
        uint256 fee = getDeployFee(rType);
        require(playerScore[player] >= fee, "Insufficient points to deploy");
        playerScore[player] -= fee;
        // Deploy the reactor
        uint256 reactorId = nextReactorId++;
        reactors[reactorId] = Reactor({
            id: reactorId,
            owner: player,
            x: x,
            y: y,
            rType: rType,
            energy: energy,
            isActive: true,
            points: 0
        });
        playerReactors[player].push(reactorId);
        reactorsDeployedThisRound[player][roundNum] += 1;
        // Track participation
        if (reactorsDeployedThisRound[player][roundNum] == 1) {
            roundsParticipated[player] += 1;
        }
        emit ReactorDeployed(reactorId, player, x, y, energy);
    }
    
    /**
     * @dev Trigger a chain of reactors, potentially starting a chain reaction
     * @param reactorIds Array of reactor IDs to trigger in the chain
     */
    function triggerReactor(uint256[] memory reactorIds) external {
        _autoResetBoardIfNeeded();
        _autoResetSeasonIfNeeded();
        // Only allow during trigger phase - use proper UTC-based timing
        uint256 secondsSinceMidnight = (block.timestamp % 1 days);
        uint256 roundTime = secondsSinceMidnight % ROUND_DURATION;
        require(roundTime >= DEPLOY_PHASE_DURATION && roundTime < DEPLOY_PHASE_DURATION + TRIGGER_PHASE_DURATION, "Not in trigger phase");
        require(reactorIds.length > 0 && reactorIds.length <= 10, "Invalid chain length");
        // Calculate cumulative failure rate and total reward/fee
        uint256 failureRate = 0;
        uint256 totalReward = 0;
        uint256 totalFee = 0;
        for (uint256 i = 0; i < reactorIds.length; i++) {
            Reactor storage reactor = reactors[reactorIds[i]];
            require(reactor.isActive, "Reactor not active");
            require(reactor.owner == msg.sender, "Not your reactor");
            // Per-type failure rate and reward
            if (reactor.rType == ReactorType.Ultra) {
                failureRate += 9;
                totalReward += 10e18;
                totalFee += 1e18;
            } else if (reactor.rType == ReactorType.High) {
                failureRate += 65; // 6.5% (use 65, divide by 10)
                totalReward += 75e16; // 7.5
                totalFee += 75e16;
            } else if (reactor.rType == ReactorType.Medium) {
                failureRate += 4;
                totalReward += 5e17;
                totalFee += 5e17;
            } else if (reactor.rType == ReactorType.Low) {
                failureRate += 15; // 1.5% (use 15, divide by 10)
                totalReward += 25e16; // 2.5
                totalFee += 25e15;
            }
        }
        // Adjust for decimal rates
        uint256 adjustedFailureRate = 0;
        for (uint256 i = 0; i < reactorIds.length; i++) {
            Reactor storage reactor = reactors[reactorIds[i]];
            if (reactor.rType == ReactorType.High || reactor.rType == ReactorType.Low) {
                adjustedFailureRate += getDeployFee(reactor.rType) / 1e17; // 6.5 or 1.5
            } else {
                adjustedFailureRate += getDeployFee(reactor.rType) / 1e18 * 10; // 9 or 4
            }
        }
        if (failureRate > 90) failureRate = 90;
        // Random check
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao))) % 100;
        if (random < failureRate) {
            // Failure: no additional penalty (deploy fee already paid)
            // Just don't award any points
        } else {
            // Success: award total reward
            playerScore[msg.sender] += totalReward;
            lastRoundPoints[msg.sender] += totalReward;
        }
        
        // Emit event for frontend tracking
        emit ReactorTriggered(reactorIds[0], totalReward, nextChainReactionId);
        emit PointsEarned(msg.sender, totalReward, playerScore[msg.sender]);
    }
    
    /**
     * @dev Get reactors near a specific position
     * @param x X coordinate
     * @param y Y coordinate
     * @return Array of nearby reactor IDs
     */
    function getNearbyReactors(uint256 x, uint256 y) internal view returns (uint256[] memory) {
        uint256[] memory nearby = new uint256[](5); // Reduced to 5 max
        uint256 count = 0;
        
        // Optimized loop - only check recent reactors
        uint256 startId = nextReactorId > 10 ? nextReactorId - 10 : 1;
        for (uint256 i = startId; i < nextReactorId && count < 5; i++) {
            if (reactors[i].isActive && isWithinRange(x, y, reactors[i].x, reactors[i].y)) {
                nearby[count] = i;
                count++;
            }
        }
        
        return nearby;
    }
    
    /**
     * @dev Check if two positions are within trigger range
     * @param x1 First X coordinate
     * @param y1 First Y coordinate
     * @param x2 Second X coordinate
     * @param y2 Second Y coordinate
     * @return True if within range
     */
    function isWithinRange(uint256 x1, uint256 y1, uint256 x2, uint256 y2) internal pure returns (bool) {
        uint256 distance = (x1 > x2 ? x1 - x2 : x2 - x1) + (y1 > y2 ? y1 - y2 : y2 - y1);
        return distance <= 3; // Trigger range of 3 units
    }
    
    /**
     * @dev Calculate points based on chain reaction complexity
     * @param chainLength Number of reactors in the chain
     * @param totalEnergy Total energy involved
     * @return Points awarded
     */
    function calculatePoints(uint256 chainLength, uint256 totalEnergy) internal pure returns (uint256) {
        // Base points from energy (much more reasonable)
        uint256 basePoints = totalEnergy / 10;
        
        // Small chain reaction bonus (capped)
        uint256 chainBonus = chainLength > 5 ? 50 : chainLength * 10;
        
        return basePoints + chainBonus;
    }
    

    
    function _simulateSuccess(uint256 failureChance) internal view returns (bool) {
        // Simple random simulation (in production, use Chainlink VRF)
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao))) % 100;
        return random >= failureChance;
    }
    
    /**
     * @dev Get all reactors for a player
     * @param player Player address
     * @return Array of reactor IDs
     */
    function getPlayerReactors(address player) external view returns (uint256[] memory) {
        return playerReactors[player];
    }
    
    /**
     * @dev Get all reactors on the board
     * @return Array of all Reactor structs
     */
    function getAllReactors() external view returns (Reactor[] memory) {
        uint256 total = nextReactorId - 1;
        Reactor[] memory all = new Reactor[](total);
        for (uint256 i = 1; i <= total; i++) {
            all[i - 1] = reactors[i];
        }
        return all;
    }
    
    function getLeaderboard(uint256 topN) external view returns (address[] memory, uint256[] memory) {
        uint256 n = topN < allPlayers.length ? topN : allPlayers.length;
        address[] memory topPlayers = new address[](n);
        uint256[] memory topScores = new uint256[](n);
        address[] memory players = allPlayers;
        uint256[] memory scores = new uint256[](players.length);
        for (uint256 i = 0; i < players.length; i++) {
            scores[i] = playerScore[players[i]];
        }
        for (uint256 i = 0; i < n; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < players.length; j++) {
                if (scores[j] > scores[maxIdx]) {
                    maxIdx = j;
                }
            }
            (scores[i], scores[maxIdx]) = (scores[maxIdx], scores[i]);
            (players[i], players[maxIdx]) = (players[maxIdx], players[i]);
            topPlayers[i] = players[i];
            topScores[i] = scores[i];
        }
        return (topPlayers, topScores);
    }
    
    /**
     * @dev Check if game is still active
     * @return True if game is active
     */
    function isGameActive() external view returns (bool) {
        // Game is always active - rounds are continuous
        return true;
    }
    
    /**
     * @dev Get game statistics
     * @return Total reactors, total chain reactions, game end time
     */
    function getGameStats() external view returns (uint256, uint256, uint256) {
        return (nextReactorId - 1, nextChainReactionId - 1, gameStartTime + ROUND_DURATION);
    }
    
    function getPlayerStats(address player) external view returns (uint256, uint256, uint256, uint256) {
        return (
            playerScore[player],           // Total points
            lastRoundPoints[player],       // Last round points
            roundsParticipated[player],    // Rounds participated
            globalRoundStartTime + ROUND_DURATION // Round end time
        );
    }
    
    function getCurrentPhase() external view returns (string memory) {
        // Use proper UTC-based timing
        uint256 secondsSinceMidnight = (block.timestamp % 1 days);
        uint256 roundTime = secondsSinceMidnight % ROUND_DURATION;
        if (roundTime < DEPLOY_PHASE_DURATION) {
            return "DEPLOY";
        } else if (roundTime < DEPLOY_PHASE_DURATION + TRIGGER_PHASE_DURATION) {
            return "TRIGGER";
        } else if (roundTime < ROUND_DURATION) {
            return "SCORING";
        } else {
            return "ENDED";
        }
    }
    
    function getPhaseTimeRemaining() external view returns (uint256) {
        // Use proper UTC-based timing
        uint256 secondsSinceMidnight = (block.timestamp % 1 days);
        uint256 roundTime = secondsSinceMidnight % ROUND_DURATION;
        if (roundTime < DEPLOY_PHASE_DURATION) {
            return DEPLOY_PHASE_DURATION - roundTime;
        } else if (roundTime < DEPLOY_PHASE_DURATION + TRIGGER_PHASE_DURATION) {
            return (DEPLOY_PHASE_DURATION + TRIGGER_PHASE_DURATION) - roundTime;
        } else if (roundTime < ROUND_DURATION) {
            return ROUND_DURATION - roundTime;
        } else {
            return 0;
        }
    }
    
    function getCurrentRoundNumber() external view returns (uint256) {
        uint256 timeElapsed = block.timestamp - globalRoundStartTime;
        return currentRoundNumber + (timeElapsed / ROUND_DURATION);
    }
    
    function isRoundActive(address player) external view returns (bool) {
        return block.timestamp < globalRoundStartTime + ROUND_DURATION;
    }

    function claimBonusPoints() external {
        require(lastClaimedSeason[msg.sender] < season, "Already claimed bonus this season");
        _addPlayer(msg.sender); // Ensures player is registered
        playerScore[msg.sender] += STARTING_POINTS;
        lastClaimedSeason[msg.sender] = season;
        emit PointsEarned(msg.sender, STARTING_POINTS, playerScore[msg.sender]);
    }
} 