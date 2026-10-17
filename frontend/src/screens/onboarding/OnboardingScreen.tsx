import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onFinish: () => void;
}

interface SlideData {
  id: string;
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
  buttonLabel: string;
  image: any;
}

const SLIDES: SlideData[] = [
  {
    id: '1',
    titlePrefix: 'Your All-in-One\n',
    titleHighlight: 'Crypto Wallet',
    subtitle:
      'Buy, sell, store and earn with Zapp Pay — a secure and easy digital asset wallet.',
    buttonLabel: 'Next ➔',
    image: require('../../../assets/images/onboarding_wallet.png'),
  },
  {
    id: '2',
    titlePrefix: '',
    titleHighlight: 'Trade Securely',
    subtitle: 'Advanced security to keep your assets safe.',
    buttonLabel: 'Next ➔',
    image: require('../../../assets/images/onboarding_security.png'),
  },
  {
    id: '3',
    titlePrefix: '',
    titleHighlight: 'Earn Together',
    subtitle: 'Invite friends and get exciting rewards.',
    buttonLabel: 'Get Started',
    image: require('../../../assets/images/onboarding_rewards.png'),
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const isNative = Platform.OS !== 'web';
    // Gentle floating hover animation for 3D illustrations
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

  const [slideWidth, setSlideWidth] = useState(Math.min(width, 420));

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const effectiveWidth = slideWidth > 0 ? slideWidth : width;
    const page = Math.round(offsetX / effectiveWidth);
    if (page !== currentIndex && page >= 0 && page < SLIDES.length) {
      setCurrentIndex(page);
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      const effectiveWidth = slideWidth > 0 ? slideWidth : width;
      scrollRef.current?.scrollTo({ x: nextIndex * effectiveWidth, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      onFinish();
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/onboarding_bg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View
        style={styles.overlayContainer}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) setSlideWidth(w);
        }}
      >
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Image
                source={require('../../../assets/images/logo_transparent.png')}
                style={styles.brandLogoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>Zapp Pay</Text>
          </View>

          <TouchableOpacity onPress={onFinish} style={styles.skipBtn}>
            <Text style={styles.skipBtnText}>Skip ✕</Text>
          </TouchableOpacity>
        </View>

        {/* Swipeable Slides ScrollView */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.scrollView}
        >
          {SLIDES.map((slide) => (
            <View key={slide.id} style={[styles.slide, { width: slideWidth }]}>
              {/* Title Section */}
              <View style={styles.textContainer}>
                <Text style={styles.titlePrefix}>
                  {slide.titlePrefix}
                  <Text style={styles.titleHighlight}>{slide.titleHighlight}</Text>
                </Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
              </View>

              {/* Central 3D Illustration */}
              <View style={styles.centerContainer}>
                <Animated.View
                  style={[
                    styles.imageWrapper,
                    { transform: [{ translateY: floatAnim }] },
                  ]}
                >
                  <Image
                    source={slide.image}
                    style={styles.illustrationImage}
                    resizeMode="contain"
                  />
                </Animated.View>
                <View style={styles.groundShadow} />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Dynamic Dot Pager Indicators */}
          <View style={styles.pagerDots}>
            {SLIDES.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  currentIndex === idx ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>

          {/* Primary Action Button (Next / Get Started) */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.actionBtn}
            onPress={handleNext}
          >
            <Text style={styles.actionBtnText}>
              {SLIDES[currentIndex].buttonLabel}
            </Text>
          </TouchableOpacity>

          {/* Bottom Skip Link */}
          <TouchableOpacity onPress={onFinish} style={styles.bottomSkipBtn}>
            <Text style={styles.bottomSkipText}>Skip</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: height * 0.065,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  brandLogoImage: {
    width: 28,
    height: 28,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B2559',
    letterSpacing: -0.3,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 8,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  titlePrefix: {
    fontSize: 29,
    fontWeight: '800',
    color: '#1B2559',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 10,
  },
  titleHighlight: {
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: '#707EAE',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
  },
  imageWrapper: {
    width: Math.min(width * 0.78, 290),
    height: Math.min(width * 0.78, 290),
    maxWidth: 290,
    maxHeight: 290,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    width: 250,
    height: 250,
    maxWidth: '100%',
    maxHeight: '100%',
  },
  groundShadow: {
    width: Math.min(width * 0.44, 160),
    maxWidth: 160,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
    marginTop: -10,
  },

  // Bottom Controls
  bottomControls: {
    paddingHorizontal: 24,
    paddingBottom: height * 0.045,
    alignItems: 'center',
  },
  pagerDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 22,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 28,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#CBD5E1',
  },
  actionBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 14,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bottomSkipBtn: {
    paddingVertical: 6,
  },
  bottomSkipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A3AED0',
  },
});
