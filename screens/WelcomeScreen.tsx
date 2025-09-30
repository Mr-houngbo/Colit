import React, { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Animated } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../contexts/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'

const { width, height } = Dimensions.get('window')

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation()
  const { theme } = useTheme()
  
  const fadeAnim = useRef(new Animated.Value(0)).current
  const logoScale = useRef(new Animated.Value(0.5)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const floatAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start()

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start()
  }, [])

  const handleGetStarted = () => {
    navigation.navigate('Auth' as never)
  }

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  })

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#6C47FF', '#9333EA', '#6C47FF']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View style={[styles.orb1, { transform: [{ rotate }] }]} />
      <Animated.View style={[styles.orb2, { transform: [{ rotate }] }]} />

      <Animated.View 
        style={[
          styles.mainContent,
          { opacity: fadeAnim }
        ]}
      >
        <Animated.View 
          style={[
            styles.logoContainer,
            { transform: [{ scale: logoScale }, { translateY }] }
          ]}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logo}>C</Text>
          </View>
          <View style={styles.logoGlow} />
        </Animated.View>

        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Transportez vos colis avec des voyageurs
          </Text>
        </View>

        <View style={styles.featuresPreview} />

        <View style={styles.ctaContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleGetStarted}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F3F4F6']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.primaryButtonText}>Commencer</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleGetStarted}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Connexion</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomVisual}>
          <Text style={styles.trustText}>+1000 voyageurs</Text>
        </View>
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  orb1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    top: -100,
    right: -150,
    opacity: 0.5,
  },
  orb2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    bottom: -50,
    left: -100,
    opacity: 0.4,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 120,
    paddingBottom: 80,
  },
  logoContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFFFFF',
    opacity: 0.2,
    top: -10,
  },
  logo: {
    fontSize: 64,
    fontWeight: '700',
    color: '#6C47FF',
  },
  heroSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: 0.5,
  },
  featuresPreview: {
    height: 20,
  },
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  buttonGradient: {
    paddingVertical: 22,
    paddingHorizontal: 48,
  },
  primaryButtonText: {
    color: '#6C47FF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 22,
    paddingHorizontal: 48,
    borderRadius: 50,
    width: '100%',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },
  bottomVisual: {
    alignItems: 'center',
  },
  trustText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1,
  },
})

export default WelcomeScreen