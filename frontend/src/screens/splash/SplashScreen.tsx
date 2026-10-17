import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ImageBackground,
  Animated,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onContinue?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const isNative = Platform.OS !== 'web';
    // Smooth entry fade-in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: isNative,
    }).start();

    // Gentle floating hover animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2200,
          useNativeDriver: isNative,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: isNative,
        }),
      ])
    ).start();
  }, []);

  return (
    <ImageBackground
      source={require('../../../assets/images/splash_bg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlayContainer}>
        {/* Main Center Branding Section */}
        <Animated.View
          style={[
            styles.centerContent,
            { opacity: fadeAnim, transform: [{ translateY: floatAnim }] },
          ]}
        >
          {/* 3D Transparent Floating Emblem */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/logo_transparent.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Brand Name */}
          <Text style={styles.brandTitle}>Zapp Pay</Text>

          {/* Brand Tagline */}
          <Text style={styles.brandSubtitle}>
            Buy  •  Sell  •  Transfer  •  Earn
          </Text>
        </Animated.View>

        {/* Bottom Footer Section */}
        <Animated.View style={[styles.bottomSection, { opacity: fadeAnim }]}>
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.getStartedButton}
            onPress={onContinue}
          >
            <Text style={styles.getStartedText}>Get Started ➔</Text>
          </TouchableOpacity>

          {/* Minimalist Trust Badges */}
          <View style={styles.trustBadgesRow}>
            <Text style={styles.trustText}>🔒 Secure</Text>
            <Text style={styles.trustDot}>•</Text>
            <Text style={styles.trustText}>⚡ Fast</Text>
            <Text style={styles.trustDot}>•</Text>
            <Text style={styles.trustText}>🌍 Global</Text>
          </View>
        </Animated.View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(6, 8, 24, 0.35)', // Cinematic subtle dark tint
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: height * 0.14,
    paddingBottom: 48,
  },

  // Center Content
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  logoImage: {
    width: 210,
    height: 210,
  },
  brandTitle: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(67, 24, 255, 0.45)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  brandSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A3AED0',
    letterSpacing: 0.6,
    textAlign: 'center',
  },

  // Bottom Section
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  getStartedButton: {
    width: '100%',
    backgroundColor: '#4318FF',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4318FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trustText: {
    color: '#8F9BBA',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  trustDot: {
    color: '#4318FF',
    fontSize: 13,
  },
});
