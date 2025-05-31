import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Background from '../components/Background';
import ApiService, { Universe, World } from '../services/api';

interface SettingsProps {
  onBack: () => void;
  onStart: (settings: GameSettings) => void;
}

interface GameSettings {
  universe: string;
  availableWorlds: string[];
  timeLimit: number;
  selectedGenres: string[];
  showVoteCount: boolean;
  showActualSpy: boolean;
}

const TIME_LIMITS = {
  MIN: 30,
  MAX: 600,
  STEP: 30,
  DEFAULT: 300
};

const Settings: React.FC<SettingsProps> = ({ onBack, onStart }) => {
  const [universes, setUniverses] = React.useState<Universe[]>([]);
  const [selectedUniverse, setSelectedUniverse] = React.useState<string | null>(null);
  const [availableWorlds, setAvailableWorlds] = React.useState<string[]>([]);
  const [selectedTimeLimit, setSelectedTimeLimit] = React.useState<number>(TIME_LIMITS.DEFAULT);
  const [showUniverseModal, setShowUniverseModal] = React.useState(false);
  const [showWorldModal, setShowWorldModal] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);
  const [showVoteCount, setShowVoteCount] = React.useState(true);
  const [showActualSpy, setShowActualSpy] = React.useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load both universes and settings in parallel
      const [universesResponse, storedSettings] = await Promise.all([
        ApiService.getInstance().getUniverses(),
        AsyncStorage.getItem('gameSettings')
      ]);

      setUniverses(universesResponse.universes);

      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        
        // Validate universe exists in current API data
        const universeExists = universesResponse.universes.some(u => u.name === settings.universe);
        if (universeExists) {
          setSelectedUniverse(settings.universe);
          
          // Validate available worlds exist in current universe
          const currentUniverse = universesResponse.universes.find(u => u.name === settings.universe);
          if (currentUniverse) {
            // Only set the worlds that were previously available
            setAvailableWorlds(settings.availableWorlds);
          }

          // Validate genres exist in current universe
          const currentUniverseGenres = new Set(
            currentUniverse?.worlds.map(w => w.genre) || []
          );
          const validGenres = settings.selectedGenres.filter((genre: string) => 
            currentUniverseGenres.has(genre)
          );
          setSelectedGenres(validGenres);
        }

        // Time limit is always valid as it's a number within our defined range
        setSelectedTimeLimit(settings.timeLimit);
        // Load showVoteCount setting
        setShowVoteCount(settings.showVoteCount !== undefined ? settings.showVoteCount : true);
        // Load showActualSpy setting
        setShowActualSpy(settings.showActualSpy !== undefined ? settings.showActualSpy : true);
      }
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts
  React.useEffect(() => {
    loadData();
  }, []);

  // Initialize available worlds when universe changes
  React.useEffect(() => {
    const initializeWorlds = async () => {
      if (selectedUniverse) {
        try {
          // First check if we have stored settings
          const storedSettings = await AsyncStorage.getItem('gameSettings');
          if (storedSettings) {
            const settings = JSON.parse(storedSettings);
            // If the stored universe matches current selection, use its available worlds
            if (settings.universe === selectedUniverse) {
              setAvailableWorlds(settings.availableWorlds);
              return;
            }
          }
          
          // If no stored settings or different universe, initialize with all worlds
          const universe = universes.find(u => u.name === selectedUniverse);
          if (universe) {
            setAvailableWorlds(universe.worlds.map(w => w.shortName));
          }
        } catch (error) {
          console.error('Error initializing worlds:', error);
        }
      } else {
        setAvailableWorlds([]);
      }
    };

    initializeWorlds();
  }, [selectedUniverse, universes]);

  // Get unique genres from selected universe only
  const getAllGenres = React.useCallback(() => {
    const genres = new Set<string>();
    const selectedUniverseData = universes.find(u => u.name === selectedUniverse);
    if (selectedUniverseData) {
      selectedUniverseData.worlds.forEach(world => {
        genres.add(world.genre);
      });
    }
    return Array.from(genres);
  }, [universes, selectedUniverse]);

  // Filter worlds based on selected genres
  const getFilteredWorlds = React.useCallback((universe: Universe) => {
    if (selectedGenres.length === 0) return universe.worlds;
    return universe.worlds.filter(world => !selectedGenres.includes(world.genre));
  }, [selectedGenres]);

  // Store settings whenever they change
  const storeSettings = async () => {
    if (!selectedUniverse) return;

    const gameSettings = {
      universe: selectedUniverse,
      availableWorlds: availableWorlds,
      timeLimit: selectedTimeLimit,
      selectedGenres: selectedGenres,
      showVoteCount: showVoteCount,
      showActualSpy: showActualSpy,
    };

    try {
      await AsyncStorage.setItem('gameSettings', JSON.stringify(gameSettings));
      console.log('Settings stored after change');
    } catch (error) {
      console.error('Error storing settings:', error);
    }
  };

  // Store settings when any relevant state changes
  React.useEffect(() => {
    if (selectedUniverse) {
      storeSettings();
    }
  }, [selectedUniverse, availableWorlds, selectedTimeLimit, selectedGenres, showVoteCount, showActualSpy]);

  const handleTimeLimitChange = (increment: boolean) => {
    setSelectedTimeLimit(prev => {
      const newValue = increment ? prev + TIME_LIMITS.STEP : prev - TIME_LIMITS.STEP;
      return Math.min(Math.max(newValue, TIME_LIMITS.MIN), TIME_LIMITS.MAX);
    });
  };

  const handleStart = async () => {
    try {
      // Get all players
      const storedPlayers = await AsyncStorage.getItem('players');
      if (!storedPlayers) {
        setError('No players found');
        return;
      }

      if (!selectedUniverse) {
        setError('Please select a universe');
        return;
      }

      const players = JSON.parse(storedPlayers);
      
      // Select a random player
      const randomIndex = Math.floor(Math.random() * players.length);
      const selectedPlayer = players[randomIndex];

      // Log the selected player
      console.log('Selected player:', selectedPlayer);

      // Store the selected player
      await AsyncStorage.setItem('selectedPlayer', JSON.stringify(selectedPlayer));

      // Store game settings
      const gameSettings = {
        universe: selectedUniverse,
        availableWorlds,
        timeLimit: selectedTimeLimit,
        selectedGenres,
        showVoteCount: showVoteCount,
        showActualSpy: showActualSpy,
      };
      await AsyncStorage.setItem('gameSettings', JSON.stringify(gameSettings));

      onStart(gameSettings);
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Failed to start game');
    }
  };

  const toggleWorld = (worldShortName: string) => {
    setAvailableWorlds(prev => {
      if (prev.includes(worldShortName)) {
        return prev.filter(id => id !== worldShortName);
      } else {
        return [...prev, worldShortName];
      }
    });
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => {
      if (prev.includes(genre)) {
        return prev.filter(g => g !== genre);
      } else {
        return [...prev, genre];
      }
    });
  };

  const renderUniverseModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showUniverseModal}
      onRequestClose={() => setShowUniverseModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Universe</Text>
          <ScrollView style={styles.modalScrollView}>
            {universes.map((universe) => (
              <TouchableOpacity
                key={universe.name}
                style={[
                  styles.modalOption,
                  selectedUniverse === universe.name && styles.selectedOption
                ]}
                onPress={() => {
                  setSelectedUniverse(universe.name);
                  setShowUniverseModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{universe.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setShowUniverseModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderWorldModal = () => {
    const selectedUniverseData = universes.find(u => u.name === selectedUniverse);
    const genres = getAllGenres();
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showWorldModal}
        onRequestClose={() => setShowWorldModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Available Worlds</Text>
            
            {/* Genre Filters */}
            <View style={styles.genreFiltersContainer}>
              <Text style={styles.genreFiltersTitle}>Filter by Genre</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.genreFiltersScroll}
              >
                {genres.map((genre) => (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.genreFilterButton,
                      selectedGenres.includes(genre) && styles.genreFilterButtonSelected
                    ]}
                    onPress={() => toggleGenre(genre)}
                  >
                    <Text style={[
                      styles.genreFilterButtonText,
                      selectedGenres.includes(genre) && styles.genreFilterButtonTextSelected
                    ]}>
                      {genre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {selectedUniverseData?.worlds
                .filter(world => !selectedGenres.includes(world.genre))
                .map((world) => (
                  <TouchableOpacity
                    key={world.shortName}
                    style={[
                      styles.modalOption,
                      !availableWorlds.includes(world.shortName) && styles.removedOption
                    ]}
                    onPress={() => toggleWorld(world.shortName)}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      !availableWorlds.includes(world.shortName) && styles.removedOptionText
                    ]}>
                      {world.name}
                    </Text>
                    <Text style={styles.worldDetails}>
                      {world.genre} • {world.developer || world.studio || world.network}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowWorldModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <Background>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="rgba(141, 141, 141, 0.6)" />
          <Text style={styles.loadingText}>Loading universes...</Text>
        </View>
      </Background>
    );
  }

  if (error) {
    return (
      <Background>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
          <Text style={styles.title}>Game Settings</Text>
          <View style={styles.separator} />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.settingsContainer}>
            {/* Universe Selection */}
            <TouchableOpacity 
              style={styles.settingCard}
              onPress={() => setShowUniverseModal(true)}
            >
              <View style={styles.settingHeader}>
                <Ionicons name="globe" size={24} color="rgba(141, 141, 141, 0.6)" />
                <Text style={styles.settingTitle}>Universe</Text>
              </View>
              <Text style={styles.settingValue}>
                {selectedUniverse || 'Select Universe'}
              </Text>
            </TouchableOpacity>

            {/* World Selection */}
            <TouchableOpacity 
              style={[
                styles.settingCard,
                !selectedUniverse && styles.settingCardDisabled
              ]}
              onPress={() => selectedUniverse && setShowWorldModal(true)}
              disabled={!selectedUniverse}
            >
              <View style={styles.settingHeader}>
                <Ionicons name="planet" size={24} color="rgba(141, 141, 141, 0.6)" />
                <Text style={styles.settingTitle}>World</Text>
              </View>
              <Text style={styles.settingValue}>
                {selectedUniverse 
                  ? `${availableWorlds.length} worlds available`
                  : 'Select Universe first'}
              </Text>
            </TouchableOpacity>

            {/* Time Limit Selection */}
            <View style={styles.settingCard}>
              <View style={styles.settingHeader}>
                <Ionicons name="time" size={24} color="rgba(141, 141, 141, 0.6)" />
                <Text style={styles.settingTitle}>Time Limit</Text>
              </View>
              <View style={styles.timeLimitContainer}>
                <TouchableOpacity
                  style={[
                    styles.timeLimitButton,
                    selectedTimeLimit <= TIME_LIMITS.MIN && styles.timeLimitButtonDisabled
                  ]}
                  onPress={() => handleTimeLimitChange(false)}
                  disabled={selectedTimeLimit <= TIME_LIMITS.MIN}
                >
                  <Text style={styles.timeLimitButtonText}>-30s</Text>
                </TouchableOpacity>
                <View style={styles.timeLimitDisplay}>
                  <Text style={styles.timeLimitText}>{selectedTimeLimit}s</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.timeLimitButton,
                    selectedTimeLimit >= TIME_LIMITS.MAX && styles.timeLimitButtonDisabled
                  ]}
                  onPress={() => handleTimeLimitChange(true)}
                  disabled={selectedTimeLimit >= TIME_LIMITS.MAX}
                >
                  <Text style={styles.timeLimitButtonText}>+30s</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Vote Count Toggle */}
            <View style={styles.settingCard}>
              <View style={styles.settingHeader}>
                <Ionicons name="eye" size={24} color="rgba(141, 141, 141, 0.6)" />
                <Text style={styles.settingTitle}>Show Vote Count</Text>
              </View>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    showVoteCount && styles.toggleSwitchActive
                  ]}
                  onPress={() => setShowVoteCount(!showVoteCount)}
                >
                  <View style={[
                    styles.toggleKnob,
                    showVoteCount && styles.toggleKnobActive
                  ]} />
                </TouchableOpacity>
                <Text style={styles.toggleLabel}>
                  {showVoteCount ? 'Visible' : 'Hidden'}
                </Text>
              </View>
            </View>

            {/* Show Actual Spy Toggle */}
            <View style={styles.settingCard}>
              <View style={styles.settingHeader}>
                <Ionicons name="person" size={24} color="rgba(141, 141, 141, 0.6)" />
                <Text style={styles.settingTitle}>Show The Spy at the end</Text>
              </View>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    showActualSpy && styles.toggleSwitchActive
                  ]}
                  onPress={() => setShowActualSpy(!showActualSpy)}
                >
                  <View style={[
                    styles.toggleKnob,
                    showActualSpy && styles.toggleKnobActive
                  ]} />
                </TouchableOpacity>
                <Text style={styles.toggleLabel}>
                  {showActualSpy ? 'Visible' : 'Hidden'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.startButtonContainer}>
          <TouchableOpacity 
            style={[
              styles.startButton,
              (!selectedUniverse || availableWorlds.length === 0) && styles.startButtonDisabled
            ]}
            onPress={handleStart}
            disabled={!selectedUniverse || availableWorlds.length === 0}
          >
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        </View>

        {renderUniverseModal()}
        {renderWorldModal()}
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
  scrollView: {
    flex: 1,
  },
  settingsContainer: {
    padding: 20,
    paddingTop: 40,
  },
  settingCard: {
    backgroundColor: 'rgba(30, 3, 48, 0.6)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
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
  settingCardDisabled: {
    opacity: 0.5,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(141, 141, 141, 0.6)',
    marginLeft: 10,
  },
  settingValue: {
    fontSize: 16,
    color: 'rgba(141, 141, 141, 0.4)',
    marginLeft: 34,
  },
  timeLimitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 34,
    gap: 20,
  },
  timeLimitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 80,
    alignItems: 'center',
  },
  timeLimitButtonDisabled: {
    opacity: 0.5,
  },
  timeLimitButtonText: {
    color: 'rgba(141, 141, 141, 0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
  timeLimitDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 100,
    alignItems: 'center',
  },
  timeLimitText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  startButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  startButton: {
    backgroundColor: 'rgba(30, 3, 48, 0.6)',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 15,
    alignItems: 'center',
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
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(30, 3, 48, 0.95)',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(141, 141, 141, 0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalScrollView: {
    maxHeight: '70%',
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalOptionText: {
    fontSize: 18,
    color: 'rgba(141, 141, 141, 0.6)',
  },
  modalCloseButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  removedOption: {
    opacity: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 0, 0, 0.3)',
  },
  removedOptionText: {
    textDecorationLine: 'line-through',
    textDecorationColor: 'rgba(255, 0, 0, 0.3)',
    textDecorationStyle: 'solid',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: 'rgba(141, 141, 141, 0.6)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'rgba(255, 0, 0, 0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(30, 3, 48, 0.6)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  worldDetails: {
    fontSize: 14,
    color: 'rgba(141, 141, 141, 0.4)',
    marginTop: 4,
  },
  genreFiltersContainer: {
    marginBottom: 20,
  },
  genreFiltersTitle: {
    fontSize: 16,
    color: 'rgba(141, 141, 141, 0.6)',
    marginBottom: 10,
  },
  genreFiltersScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  genreFilterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 10,
    backgroundColor: 'rgba(30, 3, 48, 0.6)',
  },
  genreFilterButtonSelected: {
    borderColor: 'rgba(255, 0, 0, 0.6)',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  genreFilterButtonText: {
    color: 'rgba(141, 141, 141, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  genreFilterButtonTextSelected: {
    color: 'rgba(255, 0, 0, 0.6)',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 34,
    marginTop: 10,
  },
  toggleSwitch: {
    width: 60,
    height: 30,
    backgroundColor: 'rgba(30, 3, 48, 0.8)',
    borderRadius: 15,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderColor: 'rgba(255, 0, 0, 0.6)',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(141, 141, 141, 0.6)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toggleKnobActive: {
    backgroundColor: '#ff4444',
    transform: [{ translateX: 30 }],
  },
  toggleLabel: {
    marginLeft: 15,
    fontSize: 16,
    color: 'rgba(141, 141, 141, 0.6)',
  },
});

export default Settings; 