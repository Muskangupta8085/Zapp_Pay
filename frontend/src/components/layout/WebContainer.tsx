import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WebContainerProps {
  children: React.ReactNode;
}

type DeviceMode = 'iphone' | 'android' | 'fluid';

export const WebContainer: React.FC<WebContainerProps> = ({ children }) => {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('iphone');
  const [currentTime, setCurrentTime] = useState<string>('9:41');
  const [scale, setScale] = useState<number>(1);

  // Update clock in phone status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formatted = `${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes}`;
      setCurrentTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Dynamically calculate scale for smaller laptop screens
  useEffect(() => {
    if (windowHeight < 880 && deviceMode !== 'fluid') {
      const targetScale = Math.max(0.75, Math.min(1, (windowHeight - 90) / 880));
      setScale(Number(targetScale.toFixed(2)));
    } else {
      setScale(1);
    }
  }, [windowHeight, deviceMode]);

  // Inject sleek web styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'zapp-web-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          html, body, #root {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            background-color: #060818;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          /* Modern ultra-thin translucent scrollbar */
          *::-webkit-scrollbar {
            width: 5px;
            height: 5px;
          }
          *::-webkit-scrollbar-track {
            background: transparent;
          }
          *::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.16);
            border-radius: 9999px;
          }
          *::-webkit-scrollbar-thumb:hover {
            background: rgba(99, 102, 241, 0.45);
          }

          /* Prevent ugly blue web focus halos and taps */
          input, textarea, button, select, a, [role="button"], [tabindex] {
            outline: none !important;
            -webkit-tap-highlight-color: transparent !important;
          }

          /* Clean text selection */
          [role="button"], [tabindex] {
            user-select: none;
            -webkit-user-select: none;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  // If viewed on mobile browser directly, render full bleed native view
  if (windowWidth <= 520) {
    return <View style={styles.mobileBleed}>{children}</View>;
  }

  // Device configuration specs
  const deviceSpecs = {
    iphone: {
      width: 414,
      height: 870,
      radius: 46,
      bezel: 11,
      notchType: 'island',
    },
    android: {
      width: 412,
      height: 890,
      radius: 32,
      bezel: 9,
      notchType: 'punchhole',
    },
    fluid: {
      width: Math.min(480, windowWidth - 40),
      height: Math.min(940, windowHeight - 40),
      radius: 24,
      bezel: 1,
      notchType: 'none',
    },
  }[deviceMode];

  return (
    <View style={styles.webStage}>
      {/* Ambient Cyber Light Glows */}
      <View style={[styles.ambientGlow, styles.ambientGlowLeft]} />
      <View style={[styles.ambientGlow, styles.ambientGlowRight]} />

      {/* Top Floating Control Bar */}
      <View style={styles.topControlBar}>
        <View style={styles.brandGroup}>
          <Image
            source={require('../../../assets/images/logo_transparent.png')}
            style={styles.controlLogo}
            resizeMode="contain"
          />
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>ZAPP PAY</Text>
              <View style={styles.liveBadge}>
                <View style={styles.livePulseDot} />
                <Text style={styles.liveText}>WEB VIEW</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>Decentralized Crypto & P2P Banking</Text>
          </View>
        </View>

        {/* Device Switcher Pills */}
        <View style={styles.switcherPills}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setDeviceMode('iphone')}
            style={[
              styles.pillBtn,
              deviceMode === 'iphone' && styles.pillBtnActive,
            ]}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={15}
              color={deviceMode === 'iphone' ? '#FFFFFF' : '#94A3B8'}
            />
            <Text
              style={[
                styles.pillText,
                deviceMode === 'iphone' && styles.pillTextActive,
              ]}
            >
              iPhone 16 Pro
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setDeviceMode('android')}
            style={[
              styles.pillBtn,
              deviceMode === 'android' && styles.pillBtnActive,
            ]}
          >
            <Ionicons
              name="logo-android"
              size={15}
              color={deviceMode === 'android' ? '#FFFFFF' : '#94A3B8'}
            />
            <Text
              style={[
                styles.pillText,
                deviceMode === 'android' && styles.pillTextActive,
              ]}
            >
              Pixel / Galaxy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setDeviceMode('fluid')}
            style={[
              styles.pillBtn,
              deviceMode === 'fluid' && styles.pillBtnActive,
            ]}
          >
            <Ionicons
              name="expand-outline"
              size={15}
              color={deviceMode === 'fluid' ? '#FFFFFF' : '#94A3B8'}
            />
            <Text
              style={[
                styles.pillText,
                deviceMode === 'fluid' && styles.pillTextActive,
              ]}
            >
              Fluid Web
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Action Tools */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            style={styles.actionBtn}
          >
            <Ionicons name="reload-outline" size={16} color="#CBD5E1" />
            <Text style={styles.actionBtnText}>Reload</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Device Stage Container */}
      <View style={styles.deviceViewport}>
        <View
          style={[
            styles.deviceFrame,
            {
              width: deviceSpecs.width,
              height: deviceSpecs.height,
              borderRadius: deviceSpecs.radius + deviceSpecs.bezel,
              padding: deviceSpecs.bezel,
              transform: [{ scale }],
            },
            deviceMode === 'fluid' && styles.fluidFrame,
          ]}
        >
          {/* Simulated Outer Titanium Edge Reflections */}
          {deviceMode !== 'fluid' && (
            <>
              {/* Left Side Buttons (Volume Up / Down / Action) */}
              <View style={styles.leftButtonSilent} />
              <View style={styles.leftButtonVolUp} />
              <View style={styles.leftButtonVolDown} />
              {/* Right Side Power Button */}
              <View style={styles.rightButtonPower} />
            </>
          )}

          {/* Device Screen Inner Container */}
          <View
            style={[
              styles.screenInner,
              {
                borderRadius: deviceSpecs.radius,
              },
            ]}
          >
            {/* Simulated Mobile Status Bar for Phone Mockups */}
            {deviceMode !== 'fluid' && (
              <View style={styles.mockStatusBar}>
                {/* Time */}
                <Text style={styles.statusTime}>{currentTime}</Text>

                {/* Dynamic Island or Hole Punch */}
                {deviceSpecs.notchType === 'island' ? (
                  <View style={styles.dynamicIsland}>
                    <View style={styles.islandCameraDot} />
                    <View style={styles.islandSpeakerSlot} />
                  </View>
                ) : (
                  <View style={styles.holePunchCamera} />
                )}

                {/* Right Status Indicators: Signal, WiFi, Battery */}
                <View style={styles.statusIconsGroup}>
                  <Ionicons name="cellular" size={13} color="#FFFFFF" />
                  <Ionicons name="wifi" size={13} color="#FFFFFF" />
                  <View style={styles.batteryContainer}>
                    <View style={styles.batteryLevel} />
                    <View style={styles.batteryCap} />
                  </View>
                </View>
              </View>
            )}

            {/* Render Actual App Inside Viewport */}
            <View style={styles.appCanvas}>{children}</View>

            {/* Bottom Home Indicator Bar */}
            {deviceMode !== 'fluid' && (
              <View style={styles.homeIndicatorWrapper}>
                <View style={styles.homeIndicatorBar} />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mobileBleed: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#060818',
  },
  webStage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#060818',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    width: 650,
    height: 650,
    borderRadius: 325,
    opacity: 0.12,
    pointerEvents: 'none',
  },
  ambientGlowLeft: {
    top: -100,
    left: -150,
    backgroundColor: '#6366F1',
  },
  ambientGlowRight: {
    bottom: -150,
    right: -100,
    backgroundColor: '#06B6D4',
  },

  // Top Floating Control Bar
  topControlBar: {
    width: '100%',
    maxWidth: 1200,
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    zIndex: 50,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlLogo: {
    width: 36,
    height: 36,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Switcher Pills
  switcherPills: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  pillBtnActive: {
    backgroundColor: '#4318FF',
    shadowColor: '#4318FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Right Actions
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },

  // Main Stage Viewport
  deviceViewport: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  deviceFrame: {
    backgroundColor: '#1C2237', // Deep Titanium Chassis
    borderWidth: 1,
    borderColor: '#384260',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 26 },
    shadowOpacity: 0.7,
    shadowRadius: 50,
    elevation: 30,
    position: 'relative',
  },
  fluidFrame: {
    backgroundColor: '#0B0F2A',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0.45,
    shadowRadius: 35,
  },

  // Simulated Side Buttons
  leftButtonSilent: {
    position: 'absolute',
    left: -4,
    top: 100,
    width: 3,
    height: 28,
    backgroundColor: '#303952',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  leftButtonVolUp: {
    position: 'absolute',
    left: -4,
    top: 150,
    width: 3,
    height: 52,
    backgroundColor: '#303952',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  leftButtonVolDown: {
    position: 'absolute',
    left: -4,
    top: 215,
    width: 3,
    height: 52,
    backgroundColor: '#303952',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  rightButtonPower: {
    position: 'absolute',
    right: -4,
    top: 165,
    width: 3,
    height: 72,
    backgroundColor: '#303952',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },

  // Screen Container Inside Phone Frame
  screenInner: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#090D28',
    overflow: 'hidden',
    position: 'relative',
  },

  // Mobile Status Bar
  mockStatusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    pointerEvents: 'none',
  },
  statusTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  dynamicIsland: {
    width: 110,
    height: 28,
    borderRadius: 20,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  islandCameraDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  islandSpeakerSlot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E293B',
  },
  holePunchCamera: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  statusIconsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batteryContainer: {
    width: 22,
    height: 11,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    padding: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  batteryLevel: {
    width: '85%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  batteryCap: {
    position: 'absolute',
    right: -3,
    top: 2,
    width: 2,
    height: 5,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 1,
    borderBottomRightRadius: 1,
  },

  // Actual App Screen Wrapper
  appCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  // Home Indicator Bar
  homeIndicatorWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    pointerEvents: 'none',
  },
  homeIndicatorBar: {
    width: 135,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
});
