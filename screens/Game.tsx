import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image,
  Animated,
  ImageSourcePropType,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Background from '../components/Background';
import { Ionicons } from '@expo/vector-icons';

// Import all avatar images
const avatarImages: Record<string, ImageSourcePropType> = {
  '1': require('../assets/avatars/avatar1.png'),
  '2': require('../assets/avatars/avatar2.png'),
  '3': require('../assets/avatars/avatar3.png'),
  '4': require('../assets/avatars/avatar1.png'),
  '5': require('../assets/avatars/avatar2.png'),
  '6': require('../assets/avatars/avatar3.png'),
};

interface Player {
  id: string;
  name: string;
  avatar?: string;
  order: number;
  voteCount?: number;
}

interface GameProps {
  onBack: () => void;
  onRestart?: () => void;
  onEnd?: () => void;
}

const Game: React.FC<GameProps> = ({ onBack, onRestart, onEnd }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);
  const [showWorld, setShowWorld] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedSpy, setSelectedSpy] = useState<Player | null>(null);
  const [isVotingPhase, setIsVotingPhase] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [showVoteCount, setShowVoteCount] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [showSpyReveal, setShowSpyReveal] = useState(false);
  const fadeOutAnim = useRef(new Animated.Value(1)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const spyAvatarScale = useRef(new Animated.Value(0.8)).current;

  // Load players, selected world, time limit, and selected spy
  useEffect(() => {
    const loadGameData = async () => {
      try {
        // Load players
        const storedPlayers = await AsyncStorage.getItem('players');
        if (storedPlayers) {
          const parsedPlayers = JSON.parse(storedPlayers);
          // Initialize voteCount to 0 for each player
          const playersWithVotes = parsedPlayers.map((player: Player) => ({
            ...player,
            voteCount: 0
          }));
          // Sort players by order
          const sortedPlayers = playersWithVotes.sort((a: Player, b: Player) => a.order - b.order);
          setPlayers(sortedPlayers);
        }

        // Load selected world
        const storedWorld = await AsyncStorage.getItem('selectedWorld');
        if (storedWorld) {
          setSelectedWorld(storedWorld);
        }

        // Load time limit and showVoteCount setting
        const storedSettings = await AsyncStorage.getItem('gameSettings');
        if (storedSettings) {
          const settings = JSON.parse(storedSettings);
          setTimeLeft(settings.timeLimit);
          setShowVoteCount(settings.showVoteCount !== undefined ? settings.showVoteCount : true);
        }

        // Load selected spy
        const storedSpy = await AsyncStorage.getItem('selectedPlayer');
        if (storedSpy) {
          setSelectedSpy(JSON.parse(storedSpy));
        }
      } catch (error) {
        console.error('Error loading game data:', error);
      }
    };

    loadGameData();
  }, []);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showTimer && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [showTimer, timeLeft]);

  const handleAvatarPress = () => {
    setShowWorld(true);
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleNextPlayer = () => {
    if (currentPlayerIndex === players.length - 1) {
      // If this was the last player, show timer
      setShowTimer(true);
    } else {
      // Move to next player
      setCurrentPlayerIndex(prev => prev + 1);
      // Reset world display
      setShowWorld(false);
      fadeAnim.setValue(0);
    }
  };

  const handleStartVoting = () => {
    setIsVotingPhase(true);
    setShowTimer(false);
    setCurrentPlayerIndex(0);
    setShowWorld(false);
    fadeAnim.setValue(0);
  };

  const handleVoteSelect = (playerId: string) => {
    setSelectedVote(playerId);
  };

  const handleVotingNext = () => {
    if (currentPlayerIndex < players.length - 1) {
      // Increment vote count for selected player
      if (selectedVote) {
        setPlayers(prevPlayers => 
          prevPlayers.map(player => 
            player.id === selectedVote 
              ? { ...player, voteCount: (player.voteCount || 0) + 1 }
              : player
          )
        );
      }
      setCurrentPlayerIndex(prev => prev + 1);
      setSelectedVote(null);
    } else {
      // Show results when voting is finished
      setShowResults(true);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentPlayer = players[currentPlayerIndex];
  const avatarSource = currentPlayer?.avatar ? avatarImages[currentPlayer.avatar] : null;
  const isSpy = selectedSpy && currentPlayer && selectedSpy.id === currentPlayer.id;

  const handleQuestionMarkPress = () => {
    // Fade out current content
    Animated.timing(fadeOutAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      // After fade out, wait a second then show spy
      setTimeout(() => {
        setShowSpyReveal(true);
        // Fade in spy content
        Animated.parallel([
          Animated.timing(fadeInAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(spyAvatarScale, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
          })
        ]).start();
      }, 1000);
    });
  };

  if (showResults) {
    // Find player with most votes
    const mostVotedPlayer = players.reduce((prev, current) => 
      (prev.voteCount || 0) > (current.voteCount || 0) ? prev : current
    );
    const mostVotedAvatarSource = mostVotedPlayer.avatar ? avatarImages[mostVotedPlayer.avatar] : null;
    const isCorrectVote = selectedSpy && mostVotedPlayer.id === selectedSpy.id;

    return (
      <Background>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerBackButton}
              onPress={onBack}
            >
              <Ionicons name="chevron-back" size={24} color="rgba(141, 141, 141, 0.6)" />
            </TouchableOpacity>
            <Text style={styles.title}>Voting Results</Text>
            <View style={styles.separator} />
          </View>

          <View style={styles.content}>
            {!showSpyReveal ? (
              <Animated.View style={{ opacity: fadeOutAnim }}>
                {mostVotedAvatarSource && (
                  <>
                    <View style={styles.avatarContainer}>
                      <Image 
                        source={mostVotedAvatarSource}
                        style={styles.avatar}
                      />
                      <Text style={styles.playerName}>{mostVotedPlayer.name}</Text>
                    </View>

                    <View style={styles.worldContainer}>
                      {isCorrectVote ? (
                        <>
                          <Text style={styles.worldTitle}>was</Text>
                          <Text style={[styles.worldName, styles.spyText]}>The Spy</Text>
                          <Text style={styles.resultMessage}>
                            <Text style={styles.highlightedText}>Locals have found the spy</Text>
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.worldTitle}>was</Text>
                          <Text style={styles.worldName}>Not</Text>
                          <Text style={[styles.worldName]}>The Spy</Text>
                          <Text style={styles.resultMessage}>
                            <Text style={styles.highlightedText}>The Spy</Text> has won
                          </Text>
                        </>
                      )}
                    </View>

                    {!isCorrectVote && (
                      <TouchableOpacity 
                        style={styles.questionMarkContainer}
                        onPress={handleQuestionMarkPress}
                      >
                        <View style={styles.questionMarkAvatar}>
                          <Text style={styles.questionMarkText}>?</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </Animated.View>
            ) : (
              <Animated.View 
                style={[
                  styles.spyRevealContainer,
                  { 
                    opacity: fadeInAnim,
                    transform: [{ scale: spyAvatarScale }]
                  }
                ]}
              >
                {selectedSpy && (
                  <>
                    <View style={styles.spyAvatarContainer}>
                      <Image 
                        source={avatarImages[selectedSpy.avatar || '1']}
                        style={styles.spyAvatar}
                      />
                      <Text style={styles.spyName}>{selectedSpy.name}</Text>
                    </View>
                    <View style={styles.spyRevealContainer}>
                      <Text style={styles.spyRevealText}>was</Text>
                      <Text style={[styles.spyRevealText, styles.spyText]}>The Spy</Text>
                    </View>
                  </>
                )}
              </Animated.View>
            )}
          </View>

          <View style={styles.resultsButtonContainer}>
            <TouchableOpacity 
              style={[styles.resultsButton, styles.endButton]}
              onPress={onEnd}
            >
              <Text style={styles.resultsButtonText}>End</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.resultsButton, styles.restartButton]}
              onPress={onRestart}
            >
              <Text style={styles.resultsButtonText}>Restart Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Background>
    );
  }

  if (showTimer) {
    return (
      <Background>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerBackButton}
              onPress={onBack}
            >
              <Ionicons name="chevron-back" size={24} color="rgba(141, 141, 141, 0.6)" />
            </TouchableOpacity>
            <Text style={styles.title}>Game</Text>
            <View style={styles.separator} />
          </View>

          <View style={styles.timerContainer}>
            <Text style={styles.timerTitle}>Find The Spy</Text>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            <TouchableOpacity 
              style={styles.voteButton}
              onPress={handleStartVoting}
            >
              <Text style={styles.voteButtonText}>Start Voting</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Background>
    );
  }

  if (isVotingPhase) {
    return (
      <Background>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerBackButton}
              onPress={onBack}
            >
              <Ionicons name="chevron-back" size={24} color="rgba(141, 141, 141, 0.6)" />
            </TouchableOpacity>
            <Text style={styles.title}>Voting Phase</Text>
            <View style={styles.separator} />
          </View>

          <View style={styles.content}>
            {currentPlayer && avatarSource && (
              <>
                <View style={styles.avatarContainer}>
                  <Image 
                    source={avatarSource}
                    style={styles.avatar}
                  />
                  <Text style={styles.playerName}>{currentPlayer.name}</Text>
                </View>

                <View style={styles.otherPlayersContainer}>
                  {players.map((player) => {
                    if (player.id !== currentPlayer.id) {
                      const otherAvatarSource = player.avatar ? avatarImages[player.avatar] : undefined;
                      const isSelected = selectedVote === player.id;
                      return (
                        <TouchableOpacity 
                          key={player.id} 
                          style={[
                            styles.otherPlayerItem,
                            isSelected && styles.selectedPlayerItem
                          ]}
                          onPress={() => handleVoteSelect(player.id)}
                        >
                          {otherAvatarSource && (
                            <Image 
                              source={otherAvatarSource}
                              style={[
                                styles.otherPlayerAvatar,
                                isSelected && styles.selectedPlayerAvatar
                              ]}
                            />
                          )}
                          <Text style={[
                            styles.otherPlayerName,
                            isSelected && styles.selectedPlayerName
                          ]}>{player.name}</Text>
                          {showVoteCount && (
                            <Text style={styles.voteCount}>
                              {player.voteCount || 0} votes
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    }
                    return null;
                  })}
                </View>
              </>
            )}
          </View>

          <View style={styles.nextButtonContainer}>
            <TouchableOpacity 
              style={[
                styles.nextButton,
                !selectedVote && styles.nextButtonDisabled
              ]}
              onPress={handleVotingNext}
              disabled={!selectedVote}
            >
              <Text style={[
                styles.nextButtonText,
                !selectedVote && styles.nextButtonTextDisabled
              ]}>
                {currentPlayerIndex < players.length - 1 ? 'Vote' : 'Finish Voting'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Background>
    );
  }

  return (
    <Background>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={onBack}
          >
            <Ionicons name="chevron-back" size={24} color="rgba(141, 141, 141, 0.6)" />
          </TouchableOpacity>
          <Text style={styles.title}>Game</Text>
          <View style={styles.separator} />
        </View>

        <View style={styles.content}>
          {currentPlayer && avatarSource && (
            <>
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={handleAvatarPress}
                disabled={showWorld}
              >
                <Image 
                  source={avatarSource}
                  style={styles.avatar}
                />
                <Text style={styles.playerName}>{currentPlayer.name}</Text>
              </TouchableOpacity>

              {showWorld && (
                <Animated.View 
                  style={[
                    styles.worldContainer,
                    { opacity: fadeAnim }
                  ]}
                >
                  {isSpy ? (
                    <>
                      <Text style={styles.worldTitle}>You are</Text>
                      <Text style={[styles.worldName, styles.spyText]}>The Spy</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.worldTitle}>Your World</Text>
                      <Text style={styles.worldName}>{selectedWorld}</Text>
                    </>
                  )}
                </Animated.View>
              )}
            </>
          )}
        </View>

        {showWorld && (
          <View style={styles.nextButtonContainer}>
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNextPlayer}
            >
              <Text style={styles.nextButtonText}>
                {currentPlayerIndex === players.length - 1 ? 'Start Timer' : 'Next Player'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    position: 'absolute',
    left: 20,
    top: 60,
    zIndex: 1,
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 36,
    fontWeight: '800',
    color: 'rgba(141, 141, 141, 0.6)',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 2,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(141, 141, 141, 0.3)',
    marginVertical: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  playerName: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(141, 141, 141, 0.6)',
    textAlign: 'center',
  },
  worldContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: 'rgba(30, 3, 48, 0.6)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  worldTitle: {
    fontSize: 18,
    color: 'rgba(141, 141, 141, 0.6)',
    marginBottom: 10,
  },
  worldName: {
    fontSize: 32,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  spyText: {
    color: '#ff4444',
    fontSize: 48,
    fontWeight: '800',
    textShadowColor: 'rgba(255, 68, 68, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  nextButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: 'rgba(30, 3, 48, 0.6)',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: 'rgba(141, 141, 141, 0.6)',
    textAlign: 'center',
    marginBottom: 40,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 2,
  },
  timerText: {
    fontSize: 72,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  voteButton: {
    backgroundColor: 'rgba(30, 3, 48, 0.6)',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  voteButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 1,
  },
  otherPlayersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  otherPlayerItem: {
    alignItems: 'center',
    margin: 10,
    width: 80,
    padding: 5,
  },
  selectedPlayerItem: {
    // Removed background and border styles
  },
  otherPlayerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
  },
  selectedPlayerAvatar: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  otherPlayerName: {
    fontSize: 12,
    color: 'rgba(141, 141, 141, 0.6)',
    textAlign: 'center',
  },
  selectedPlayerName: {
    color: '#ffffff',
    fontWeight: '600',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  voteCount: {
    fontSize: 10,
    color: 'rgba(141, 141, 141, 0.6)',
    marginTop: 2,
  },
  resultMessage: {
    fontSize: 24,
    color: 'rgba(141, 141, 141, 0.6)',
    textAlign: 'center',
    marginTop: 20,
  },
  highlightedText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  resultsButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  resultsButton: {
    backgroundColor: 'rgba(30, 3, 48, 0.6)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 120,
    alignItems: 'center',
  },
  endButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderColor: 'rgba(255, 0, 0, 0.6)',
  },
  restartButton: {
    backgroundColor: 'rgba(30, 3, 48, 0.6)',
  },
  resultsButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
  },
  questionMarkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  questionMarkAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(30, 3, 48, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionMarkText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgba(141, 141, 141, 0.6)',
  },
  spyRevealContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spyAvatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  spyAvatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#ff4444',
    marginBottom: 20,
  },
  spyName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ff4444',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 68, 68, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  spyRevealText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default Game; 