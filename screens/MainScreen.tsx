import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Background from '../components/Background';

interface MainScreenProps {
  onNext: () => void;
}

const MainScreen: React.FC<MainScreenProps> = ({ onNext }) => {
  return (
    <Background isMainMenu>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>SpyXMissions</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={onNext}
          >
            <Text style={styles.buttonText}>Where Am I?</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => console.log('Profile pressed')}
          >
            <Text style={styles.buttonText}>Elimination</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: 'rgba(141, 141, 141, 0.6)',
    marginBottom: 60,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 2,
  },
  buttonContainer: {
    width: '85%',
    gap: 25,
  },
  button: {
    backgroundColor: 'rgba(30, 3, 48, 0.6)',
    paddingVertical: 18,
    paddingHorizontal: 30,
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
  buttonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 1,
  },
});

export default MainScreen; 