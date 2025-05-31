import React from 'react';
import { ImageBackground, StyleSheet, View, ViewStyle } from 'react-native';
import { Asset } from 'expo-asset';

interface BackgroundProps {
  children: React.ReactNode;
  isMainMenu?: boolean;
  style?: ViewStyle;
}

const Background: React.FC<BackgroundProps> = ({ children, isMainMenu, style }) => {
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);

  React.useEffect(() => {
    const preloadImage = async () => {
      try {
        const imageAsset = Asset.fromModule(
          isMainMenu 
            ? require('../assets/backgrounds/main-menu-bg.png')
            : require('../assets/backgrounds/game-bg.png')
        );
        await imageAsset.downloadAsync();
        setIsImageLoaded(true);
      } catch (error) {
        console.error('Error preloading background:', error);
        setIsImageLoaded(true); // Still show the background even if preload fails
      }
    };

    preloadImage();
  }, [isMainMenu]);

  if (!isImageLoaded) {
    return (
      <View style={[styles.container, style, { backgroundColor: '#1E0330' }]}>
        {children}
      </View>
    );
  }

  return (
    <ImageBackground
      source={
        isMainMenu 
          ? require('../assets/backgrounds/main-menu-bg.png')
          : require('../assets/backgrounds/game-bg.png')
      }
      style={[styles.container, style]}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default Background; 