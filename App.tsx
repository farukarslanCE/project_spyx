import React from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import MainScreen from './screens/MainScreen';
import PlayersPanel from './screens/PlayersPanel';
import GameMode from './screens/GameMode';
import Settings from './screens/Settings';
import GameIntro from './screens/GameIntro';
import Game from './screens/Game';

export default function App() {
  const [currentScreen, setCurrentScreen] = React.useState<'main' | 'gameMode' | 'players' | 'settings' | 'gameIntro' | 'game'>('main');
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const [nextScreen, setNextScreen] = React.useState<'main' | 'gameMode' | 'players' | 'settings' | 'gameIntro' | 'game' | null>(null);

  const handleScreenChange = (newScreen: 'main' | 'gameMode' | 'players' | 'settings' | 'gameIntro' | 'game') => {
    setNextScreen(newScreen);
  };

  const handleReturnToMain = () => {
    handleScreenChange('main');
  };

  React.useEffect(() => {
    if (nextScreen) {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Update screen and fade in
        setCurrentScreen(nextScreen);
        setNextScreen(null);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [nextScreen]);

  const handleBack = () => {
    if (currentScreen === 'gameMode') {
      handleScreenChange('main');
    } else if (currentScreen === 'players') {
      handleScreenChange('gameMode');
    } else if (currentScreen === 'settings') {
      handleScreenChange('players');
    } else if (currentScreen === 'gameIntro') {
      handleScreenChange('settings');
    } else if (currentScreen === 'game') {
      handleScreenChange('gameIntro');
    }
  };

  const handleGameModeSelect = (mode: string) => {
    console.log('Selected mode:', mode);
    if (mode === 'Classic') {
      handleScreenChange('players');
    } else {
      console.log('Selected mode:', mode);
      // Handle other modes (LAN, Multiplayer) here
    }
  };

  const handleStartGame = (settings: { universe: string; availableWorlds: string[]; timeLimit: number }) => {
    console.log('Starting game with settings:', settings);
    handleScreenChange('gameIntro');
  };

  const handleStartMission = () => {
    console.log('Starting mission...');
    handleScreenChange('game');
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
        {currentScreen === 'main' && (
          <MainScreen onNext={() => handleScreenChange('gameMode')} />
        )}
        {currentScreen === 'gameMode' && (
          <GameMode onBack={handleBack} onSelectMode={handleGameModeSelect} />
        )}
        {currentScreen === 'players' && (
          <PlayersPanel onBack={handleBack} onNext={() => handleScreenChange('settings')} />
        )}
        {currentScreen === 'settings' && (
          <Settings onBack={handleBack} onStart={handleStartGame} />
        )}
        {currentScreen === 'gameIntro' && (
          <GameIntro onBack={handleBack} onStartMission={handleStartMission} />
        )}
        {currentScreen === 'game' && (
          <Game onBack={handleBack} onRestart={() => handleScreenChange('settings')} onEnd={handleReturnToMain} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  screenContainer: {
    flex: 1,
  },
});
