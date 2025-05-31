import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Background from '../components/Background';

interface GameModeProps {
  onBack: () => void;
  onSelectMode: (mode: string) => void;
}

const GAME_MODES = [
  {
    id: 'Classic',
    name: 'Local',
    description: 'Play with friends on the same device. Pass the phone to the next player.',
    icon: 'game-controller',
  },
  {
    id: 'LAN',
    name: 'LAN',
    description: 'Play with friends on the same network',
    icon: 'flash',
  },
  {
    id: 'Multiplayer',
    name: 'Multiplayer',
    description: 'Play with friends online',
    icon: 'settings',
  },
];

const GameMode: React.FC<GameModeProps> = ({ onBack, onSelectMode }) => {
  const [selectedMode, setSelectedMode] = React.useState<string | null>(null);

  const handleModeSelect = (modeId: string) => {
    setSelectedMode(modeId);
    onSelectMode(modeId);
  };

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
          <Text style={styles.title}>Game Mode</Text>
          <View style={styles.separator} />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.modesContainer}>
            {GAME_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.modeCard,
                  selectedMode === mode.id && styles.selectedMode
                ]}
                onPress={() => handleModeSelect(mode.id)}
              >
                <View style={styles.modeIconContainer}>
                  <Ionicons 
                    name={mode.icon as any} 
                    size={32} 
                    color="rgba(141, 141, 141, 0.6)" 
                  />
                </View>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeName}>{mode.name}</Text>
                  <Text style={styles.modeDescription}>{mode.description}</Text>
                </View>
                {selectedMode === mode.id && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color="rgba(255, 255, 255, 0.8)" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
  modesContainer: {
    padding: 20,
    paddingTop: 40,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  selectedMode: {
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(30, 3, 48, 0.8)',
  },
  modeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(141, 141, 141, 0.6)',
    marginBottom: 5,
  },
  modeDescription: {
    fontSize: 14,
    color: 'rgba(141, 141, 141, 0.4)',
  },
  checkmark: {
    marginLeft: 10,
  },
});

export default GameMode; 