import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  TextInput, 
  Alert, 
  Image,
  PanResponder,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Background from '../components/Background';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PanGestureHandler } from 'react-native-gesture-handler';

interface Player {
  id: string;
  name: string;
  avatar?: string;
  order: number;
}

interface PlayersPanelProps {
  onBack: () => void;
  onNext: () => void;
}

const AVATAR_OPTIONS = [
  { id: '1', source: require('../assets/avatars/avatar1.png') },
  { id: '2', source: require('../assets/avatars/avatar2.png') },
  { id: '3', source: require('../assets/avatars/avatar3.png') },
  { id: '4', source: require('../assets/avatars/avatar1.png') },
  { id: '5', source: require('../assets/avatars/avatar2.png') },
  { id: '6', source: require('../assets/avatars/avatar3.png') },
];

const SCREEN_HEIGHT = Dimensions.get('window').height;
const TRASH_ZONE_HEIGHT = 100;

const PlayersPanel: React.FC<PlayersPanelProps> = ({ onBack, onNext }) => {
  const [players, setPlayers] = React.useState<Player[]>([]);
  const playersRef = React.useRef<Player[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = React.useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = React.useState(false);
  const [editingPlayer, setEditingPlayer] = React.useState<Player | null>(null);
  const [newPlayerName, setNewPlayerName] = React.useState('');
  const [selectedAvatar, setSelectedAvatar] = React.useState<string | null>(null);
  const [draggedPlayer, setDraggedPlayer] = React.useState<Player | null>(null);
  const [showTrash, setShowTrash] = React.useState(false);
  const [isReordering, setIsReordering] = React.useState(false);
  const draggedPlayerRef = React.useRef<Player | null>(null);
  const dropTargetRef = React.useRef<number | null>(null);
  
  // Animation values for each player
  const playerAnimations = React.useRef<{ [key: string]: Animated.ValueXY }>({});
  
  // Initialize animation values for players
  React.useEffect(() => {
    players.forEach(player => {
      if (!playerAnimations.current[player.id]) {
        playerAnimations.current[player.id] = new Animated.ValueXY({ x: 0, y: 0 });
      }
    });
  }, [players]);

  // Update ref when players state changes
  React.useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const pan = React.useRef(new Animated.ValueXY()).current;
  const scale = React.useRef(new Animated.Value(1)).current;

  const calculatePlayerPosition = (index: number) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    return {
      x: col * 120, // colWidth
      y: row * 120  // rowHeight
    };
  };

  const animatePlayersToNewPositions = (draggedIndex: number, targetIndex: number) => {
    const newPlayers = [...playersRef.current];
    const [draggedPlayer] = newPlayers.splice(draggedIndex, 1);
    newPlayers.splice(targetIndex, 0, draggedPlayer);

    // Animate each player to their new position
    newPlayers.forEach((player, index) => {
      const newPos = calculatePlayerPosition(index);
      const currentPos = calculatePlayerPosition(playersRef.current.findIndex(p => p.id === player.id));
      
      Animated.spring(playerAnimations.current[player.id], {
        toValue: {
          x: newPos.x - currentPos.x,
          y: newPos.y - currentPos.y
        },
        useNativeDriver: true,
        tension: 50,
        friction: 7
      }).start();
    });
  };

  const resetPlayerAnimations = () => {
    Object.values(playerAnimations.current).forEach(anim => {
      Animated.spring(anim, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
        tension: 50,
        friction: 7
      }).start();
    });
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setValue({ x: 0, y: 0 });
        Animated.spring(scale, {
          toValue: 1.1,
          useNativeDriver: true,
        }).start();
        setShowTrash(true);
        setIsReordering(true);
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        const isOverTrash = gestureState.moveY > SCREEN_HEIGHT - TRASH_ZONE_HEIGHT;
        
        if (isOverTrash) {
          setIsReordering(false);
          if (dropTargetRef.current !== null) {
            console.log('Entering trash zone, clearing drop target');
            dropTargetRef.current = null;
            resetPlayerAnimations();
          }
        } else {
          setIsReordering(true);
          
          const rowHeight = 120;
          const colWidth = 120;
          const startY = 140;
          const startX = 20;
          
          const row = Math.floor((gestureState.moveY - startY) / rowHeight);
          const col = Math.floor((gestureState.moveX - startX) / colWidth);
          const targetIndex = row * 3 + col;
          
          if (targetIndex >= 0 && targetIndex < playersRef.current.length) {
            const draggedPlayerIndex = playersRef.current.findIndex(p => p.id === draggedPlayerRef.current?.id);
            if (targetIndex !== draggedPlayerIndex) {
              if (targetIndex !== dropTargetRef.current) {
                console.log('New drop target detected:', targetIndex);
                dropTargetRef.current = targetIndex;
                if (draggedPlayerIndex !== -1) {
                  animatePlayersToNewPositions(draggedPlayerIndex, targetIndex);
                }
              }
            } else {
              if (dropTargetRef.current !== null) {
                console.log('Over dragged player, clearing drop target');
                dropTargetRef.current = null;
                resetPlayerAnimations();
              }
            }
          } else {
            if (dropTargetRef.current !== null) {
              console.log('Invalid position, clearing drop target');
              dropTargetRef.current = null;
              resetPlayerAnimations();
            }
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const isOverTrash = gestureState.moveY > SCREEN_HEIGHT - TRASH_ZONE_HEIGHT;
        
        if (isOverTrash && draggedPlayerRef.current) {
          handleDeletePlayer(draggedPlayerRef.current.id);
        } else if (draggedPlayerRef.current && dropTargetRef.current !== null) {
          const draggedIndex = playersRef.current.findIndex(p => p.id === draggedPlayerRef.current?.id);
          const targetIndex = dropTargetRef.current;
          
          const newPlayers = [...playersRef.current];
          const [draggedPlayer] = newPlayers.splice(draggedIndex, 1);
          newPlayers.splice(targetIndex, 0, draggedPlayer);
          
          newPlayers.forEach((player, index) => {
            player.order = index;
          });
          
          setPlayers(newPlayers);
        }
        
        // Reset all animations and states
        resetPlayerAnimations();
        setDraggedPlayer(null);
        draggedPlayerRef.current = null;
        setShowTrash(false);
        setIsReordering(false);
        dropTargetRef.current = null;

        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          })
        ]).start();
      },
    })
  ).current;

  const clearAndReinitializeStorage = async () => {
    try {
      console.log('Clearing storage...');
      await AsyncStorage.removeItem('players');
      setPlayers([]); // Set empty array after clearing storage
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  // Load players from storage when component mounts
  React.useEffect(() => {
    console.log('Component mounted, loading players...');
    loadPlayers();
  }, []);

  // Track player state changes and save
  React.useEffect(() => {
    console.log('Players state updated, saving players:', players);
    if (players.length > 0) {  // Only save if we have players
      savePlayers();
    }
  }, [players]);

  const loadPlayers = async () => {
    try {
      console.log('Loading players from storage...');
      const savedPlayers = await AsyncStorage.getItem('players');
      console.log('Raw saved players:', savedPlayers);
      
      if (savedPlayers) {
        const parsedPlayers = JSON.parse(savedPlayers);
        console.log('Parsed players:', parsedPlayers);
        
        // Add order to existing players if they don't have it
        const playersWithOrder = parsedPlayers.map((player: Player, index: number) => ({
          ...player,
          order: player.order ?? index
        }));
        
        console.log('Players with order:', playersWithOrder);
        setPlayers(playersWithOrder);
      } else {
        console.log('No players found in storage, setting empty array');
        setPlayers([]); // Set empty array instead of initializing test players
      }
    } catch (error) {
      console.error('Error loading players:', error);
      setPlayers([]); // Set empty array on error
    }
  };

  const savePlayers = async () => {
    try {
      console.log('Saving players to storage:', players);
      const playersToSave = players.map(player => ({
        ...player,
        order: player.order
      }));
      console.log('Formatted players to save:', playersToSave);
      await AsyncStorage.setItem('players', JSON.stringify(playersToSave));
      console.log('Players saved successfully');
    } catch (error) {
      console.error('Error saving players:', error);
    }
  };

  const handleAddPlayer = () => {
    if (newPlayerName.trim().length === 0) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (newPlayerName.length > 9) {
      Alert.alert('Error', 'Name must be 9 characters or less');
      return;
    }
    if (!selectedAvatar) {
      Alert.alert('Error', 'Please select an avatar');
      return;
    }
    
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      avatar: selectedAvatar,
      order: players.length, // This will be the last position
    };
    
    setPlayers(prevPlayers => {
      const newPlayers = [...prevPlayers, newPlayer];
      // Ensure all players have correct order values
      newPlayers.forEach((player, index) => {
        player.order = index;
      });
      return newPlayers;
    });
    
    setNewPlayerName('');
    setSelectedAvatar(null);
    setIsAddModalVisible(false);
  };

  const handleEditPlayer = () => {
    if (!editingPlayer) return;
    
    if (newPlayerName.trim().length === 0) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (newPlayerName.length > 9) {
      Alert.alert('Error', 'Name must be 9 characters or less');
      return;
    }
    if (!selectedAvatar) {
      Alert.alert('Error', 'Please select an avatar');
      return;
    }
    
    setPlayers(prevPlayers => {
      const newPlayers = prevPlayers.map(player => 
        player.id === editingPlayer.id 
          ? { ...player, name: newPlayerName.trim(), avatar: selectedAvatar }
          : player
      );
      return newPlayers;
    });
    
    setNewPlayerName('');
    setSelectedAvatar(null);
    setEditingPlayer(null);
    setIsEditModalVisible(false);
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setNewPlayerName(player.name);
    setSelectedAvatar(player.avatar || null);
    setIsEditModalVisible(true);
  };

  const handleDeletePlayer = (playerId: string) => {
    console.log('handleDeletePlayer called with ID:', playerId);
    Alert.alert(
      'Delete Player',
      'Are you sure you want to delete this player?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            console.log('Delete confirmed for player:', playerId);
            setPlayers(prevPlayers => {
              console.log('Previous players:', prevPlayers);
              // Filter out the deleted player
              const newPlayers = prevPlayers.filter(p => p.id !== playerId);
              // Update order values for remaining players
              newPlayers.forEach((player, index) => {
                player.order = index;
              });
              console.log('New players:', newPlayers);
              return newPlayers;
            });
            
            // Immediately save the updated players list to storage
            try {
              const updatedPlayers = players.filter(p => p.id !== playerId);
              await AsyncStorage.setItem('players', JSON.stringify(updatedPlayers));
              console.log('Players saved after deletion');
            } catch (error) {
              console.error('Error saving players after deletion:', error);
            }
          }
        }
      ]
    );
  };

  const renderPlayerAvatar = (player?: Player, index?: number) => {
    if (!player) {
      return (
        <TouchableOpacity 
          key={`empty-slot-${index}`}
          style={styles.avatarContainer}
          onPress={() => setIsAddModalVisible(true)}
        >
          <View style={styles.avatar}>
            <Ionicons name="add" size={30} color="rgba(141, 141, 141, 0.6)" />
          </View>
        </TouchableOpacity>
      );
    }

    const isDragging = draggedPlayer?.id === player.id;
    const isDropTarget = isReordering && dropTargetRef.current === index;
    const animation = playerAnimations.current[player.id];

    return (
      <Animated.View
        key={`player-${player.id}`}
        style={[
          styles.avatarContainer,
          isDragging && {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: scale }
            ],
            zIndex: 1000,
          },
          !isDragging && animation && {
            transform: [
              { translateX: animation.x },
              { translateY: animation.y }
            ]
          },
          isDropTarget && styles.dropTarget
        ]}
        {...(isDragging ? panResponder.panHandlers : {})}
      >
        <TouchableOpacity 
          style={styles.avatar}
          onLongPress={() => {
            setDraggedPlayer(player);
            draggedPlayerRef.current = player;
          }}
          onPress={() => openEditModal(player)}
          delayLongPress={200}
        >
          {player.avatar ? (
            <Image 
              source={AVATAR_OPTIONS.find(a => a.id === player.avatar)?.source} 
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarPlaceholder}>
              {player.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </TouchableOpacity>
        <Text style={styles.playerName} numberOfLines={1}>
          {player.name}
        </Text>
      </Animated.View>
    );
  };

  const renderPlayerRow = (startIndex: number) => {
    // Sort players by order before rendering
    const sortedPlayers = [...players].sort((a, b) => a.order - b.order);
    const rowPlayers = sortedPlayers.slice(startIndex, startIndex + 3);
    const emptySlots = 3 - rowPlayers.length;
    
    return (
      <View key={`row-${startIndex}`} style={styles.playerRow}>
        {rowPlayers.map((player, index) => renderPlayerAvatar(player, startIndex + index))}
        {emptySlots > 0 && renderPlayerAvatar(undefined, startIndex + rowPlayers.length)}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Background>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onBack}
            >
              <Ionicons name="chevron-back" size={24} color="rgba(141, 141, 141, 0.6)" />
            </TouchableOpacity>
            <Text style={styles.title}>Players</Text>
            <View style={styles.separator} />
          </View>
          <ScrollView 
            style={styles.scrollView}
            scrollEnabled={!draggedPlayer}
          >
            <View style={styles.playersContainer}>
              {players.length === 0 ? (
                renderPlayerRow(0)
              ) : (
                Array.from({ length: Math.ceil((players.length + 1) / 3) }).map((_, index) => 
                  renderPlayerRow(index * 3)
                )
              )}
            </View>
          </ScrollView>

          {showTrash ? (
            <View style={styles.trashZone}>
              <Ionicons name="trash" size={40} color="rgba(255, 0, 0, 0.6)" />
            </View>
          ) : (
            <View style={styles.nextButtonContainer}>
              <TouchableOpacity 
                style={styles.nextButton}
                onPress={onNext}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}

          <Modal
            animationType="slide"
            transparent={true}
            visible={isAddModalVisible}
            onRequestClose={() => setIsAddModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add New Player</Text>
                
                <View style={styles.avatarSelection}>
                  <Text style={styles.avatarSelectionTitle}>Choose Avatar</Text>
                  <View style={styles.avatarGrid}>
                    {AVATAR_OPTIONS.map((avatar) => (
                      <TouchableOpacity
                        key={`avatar-${avatar.id}`}
                        style={[
                          styles.avatarOption,
                          selectedAvatar === avatar.id && styles.selectedAvatar
                        ]}
                        onPress={() => setSelectedAvatar(avatar.id)}
                      >
                        <Image source={avatar.source} style={styles.avatarOptionImage} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Enter player name"
                  placeholderTextColor="rgba(141, 141, 141, 0.6)"
                  value={newPlayerName}
                  onChangeText={setNewPlayerName}
                  maxLength={9}
                  autoFocus
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => {
                      setIsAddModalVisible(false);
                      setNewPlayerName('');
                      setSelectedAvatar(null);
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.addButton]} 
                    onPress={handleAddPlayer}
                  >
                    <Text style={styles.buttonText}>Add Player</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent={true}
            visible={isEditModalVisible}
            onRequestClose={() => setIsEditModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Player</Text>
                
                <View style={styles.avatarSelection}>
                  <Text style={styles.avatarSelectionTitle}>Choose Avatar</Text>
                  <View style={styles.avatarGrid}>
                    {AVATAR_OPTIONS.map((avatar) => (
                      <TouchableOpacity
                        key={`avatar-${avatar.id}`}
                        style={[
                          styles.avatarOption,
                          selectedAvatar === avatar.id && styles.selectedAvatar
                        ]}
                        onPress={() => setSelectedAvatar(avatar.id)}
                      >
                        <Image source={avatar.source} style={styles.avatarOptionImage} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Enter player name"
                  placeholderTextColor="rgba(141, 141, 141, 0.6)"
                  value={newPlayerName}
                  onChangeText={setNewPlayerName}
                  maxLength={9}
                  autoFocus
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => {
                      setIsEditModalVisible(false);
                      setNewPlayerName('');
                      setSelectedAvatar(null);
                      setEditingPlayer(null);
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.addButton]} 
                    onPress={handleEditPlayer}
                  >
                    <Text style={styles.buttonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </Background>
    </GestureHandlerRootView>
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
  backButton: {
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
  playersContainer: {
    padding: 20,
    paddingTop: 40,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    width: 100,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(30, 3, 48, 0.6)',
    justifyContent: 'center',
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    fontSize: 32,
    color: 'rgba(141, 141, 141, 0.6)',
    fontWeight: '600',
  },
  playerName: {
    color: 'rgba(141, 141, 141, 0.6)',
    marginTop: 8,
    fontSize: 16,
    maxWidth: 100,
    textAlign: 'center',
  },
  trashZone: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TRASH_ZONE_HEIGHT,
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 0, 0, 0.4)',
  },
  nextButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TRASH_ZONE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  nextButton: {
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
  nextButtonText: {
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
  avatarSelection: {
    marginBottom: 20,
  },
  avatarSelectionTitle: {
    fontSize: 18,
    color: 'rgba(141, 141, 141, 0.6)',
    marginBottom: 10,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selectedAvatar: {
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  addButton: {
    backgroundColor: 'rgba(30, 3, 48, 0.8)',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dropTarget: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default PlayersPanel; 