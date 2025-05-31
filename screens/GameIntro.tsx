import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Background from '../components/Background';

interface GameIntroProps {
  onStartMission: () => void;
  onBack: () => void;
}

const GameIntro: React.FC<GameIntroProps> = ({ onStartMission, onBack }) => {
  return (
    <Background>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Mission Briefing</Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Introduction</Text>
              <Text style={styles.text}>
                Welcome to your first mission, agent. You are about to embark on a thrilling journey of espionage and strategy. 
                Your skills, wit, and quick thinking will be put to the test as you navigate through complex scenarios and challenges.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mission Tips</Text>
              <View style={styles.tipsContainer}>
                <Text style={styles.tipText}>• Stay alert and observe your surroundings carefully</Text>
                <Text style={styles.tipText}>• Use your resources wisely</Text>
                <Text style={styles.tipText}>• Think before you act</Text>
                <Text style={styles.tipText}>• Remember your training</Text>
                <Text style={styles.tipText}>• Trust your instincts</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.newButtonContainer}>
          <TouchableOpacity 
              style={[styles.fullButton, styles.startButtonNew]} 
              onPress={onStartMission}
            >
              <Text style={styles.fullButtonText}>Start Mission</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.fullButton, styles.backButtonNew]} 
              onPress={onBack}
            >
              <Text style={styles.fullButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    </Background>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
  },
  titleContainer: {
    marginTop: Platform.OS === 'ios' ? 20 : 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: 'rgba(141, 141, 141, 0.6)',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 2,
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'rgba(30, 3, 48, 0.6)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 15,
    letterSpacing: 1,
  },
  text: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 26,
    letterSpacing: 0.5,
  },
  tipsContainer: {
    gap: 12,
  },
  tipText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 26,
    letterSpacing: 0.5,
  },
  newButtonContainer: {
    marginTop: 20,
    gap: 16,
  },
  fullButton: {
    width: '100%',
    paddingVertical: 18,
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
  backButtonNew: {
    backgroundColor: 'rgba(30, 3, 48, 0.6)',
  },
  startButtonNew: {
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
  },
  fullButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export default GameIntro; 