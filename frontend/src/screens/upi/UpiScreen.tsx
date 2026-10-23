import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ImageBackground,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { apiClient } from '../../api/client';

interface UpiScreenProps {
  onBack?: () => void;
  onNavigateToOrders?: () => void;
  onNavigateToRequest?: () => void;
}

export const UpiScreen: React.FC<UpiScreenProps> = ({
  onBack,
  onNavigateToOrders,
  onNavigateToRequest,
}) => {
  const [selectedDepositAmount, setSelectedDepositAmount] = useState('1500');
  const [customAmount, setCustomAmount] = useState('1500');
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedVpa, setCopiedVpa] = useState(false);

  const handleCopyVpa = () => {
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleVerifyUtr = async () => {
    if (utrNumber.trim().length < 10) {
      Alert.alert('Invalid UTR', 'Please enter a valid 12-digit UPI reference / UTR number.');
      return;
    }

    try {
      await apiClient.post('/wallet/request', {
        amount: Number(customAmount),
        requestType: 'coin_request',
        note: `UPI Deposit UTR: ${utrNumber.trim()}`,
      });

      Alert.alert(
        'Deposit Submitted for Verification ⏳',
        `UTR ${utrNumber.trim()} has been registered with our settlement pipeline. Funds will be credited automatically once bank confirmation completes.`,
        [
          {
            text: 'View Orders',
            onPress: () => onNavigateToOrders && onNavigateToOrders(),
          },
          { text: 'Done', style: 'cancel' },
        ]
      );
      setUtrNumber('');
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Failed to submit deposit for verification.');
    }
  };

  const handleOpenUpiApp = async (appName: string) => {
    const payeeVpa = 'zapppay@icici';
    const payeeName = 'Zapp Pay Treasury';
    const transactionNote = encodeURIComponent(`Deposit ${customAmount}`);
    const upiUrl = `upi://pay?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&am=${customAmount}&cu=INR&tn=${transactionNote}`;

    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) {
        await Linking.openURL(upiUrl);
        return;
      }
    } catch {
      // Fallback to instructions below if direct URI scheme is unavailable
    }

    Alert.alert(
      `Launching ${appName}`,
      `Please complete payment of ₹ ${customAmount} to ${payeeVpa} in ${appName}. Once paid, copy the 12-digit UTR/Ref number and paste it below to verify.`,
      [
        {
          text: 'I Have Paid',
          onPress: () => Alert.alert('Deposit Processing', 'Enter your 12-digit UTR number below and tap "Verify & Credit Deposit".'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/onboarding_bg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#1B2559" />
          </TouchableOpacity>

          <View style={styles.headerTitleCenter}>
            <Text style={styles.headerTitle}>UPI Gateway</Text>
            <Text style={styles.headerSubtitle}>Instant 0% Fee Deposits</Text>
          </View>

          <View style={styles.headerBrandBadge}>
            <Image
              source={require('../../../assets/images/logo_transparent.png')}
              style={styles.headerLogoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Segmented Switcher: Pay / Deposit vs Request Money */}
          <View style={styles.tabSwitcherRow}>
            <TouchableOpacity
              style={[styles.switcherTab, styles.switcherTabActive]}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={13} color="#FFFFFF" />
              <Text style={styles.switcherTabTextActive}>Pay / Deposit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switcherTab}
              onPress={onNavigateToRequest}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-down" size={13} color="#64748B" />
              <Text style={styles.switcherTabText}>Request Money 💸</Text>
            </TouchableOpacity>
          </View>

          {/* Official VPA Card */}
          <LinearGradient
            colors={['#0D0924', '#1B114D', '#2E118A', '#4318FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vpaHeroCard}
          >
            <View style={styles.vpaTopRow}>
              <View style={styles.verifiedRow}>
                <Ionicons name="shield-checkmark" size={13} color="#05CD99" />
                <Text style={styles.vpaCardLabel}>VERIFIED ZAPP PAY MERCHANT VPA</Text>
              </View>
              <View style={styles.instantPill}>
                <Ionicons name="flash" size={10} color="#FFB547" />
                <Text style={styles.instantPillText}>Instant</Text>
              </View>
            </View>

            <View style={styles.vpaCopyRow}>
              <View>
                <Text style={styles.vpaAddress}>zapppay@icici</Text>
                <Text style={styles.vpaBank}>ICICI Bank UPI Gateway • NPCI Certified</Text>
              </View>

              <TouchableOpacity
                style={[styles.copyBtn, copiedVpa && styles.copyBtnDone]}
                onPress={handleCopyVpa}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={copiedVpa ? 'checkmark' : 'copy-outline'}
                  size={15}
                  color={copiedVpa ? '#05CD99' : '#FFFFFF'}
                />
                <Text style={[styles.copyBtnText, copiedVpa && { color: '#05CD99' }]}>
                  {copiedVpa ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Deposit Amount Preset Selector */}
          <Text style={styles.sectionLabel}>CHOOSE DEPOSIT AMOUNT</Text>
          <View style={styles.presetChipsRow}>
            {['500', '1000', '1500', '2500', '5000', '10000'].map((amt) => {
              const isSelected = selectedDepositAmount === amt;
              return (
                <TouchableOpacity
                  key={amt}
                  style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  onPress={() => {
                    setSelectedDepositAmount(amt);
                    setCustomAmount(amt);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      isSelected && styles.presetChipTextActive,
                    ]}
                  >
                    ₹{amt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Amount Display Box */}
          <View style={styles.amountDisplayCard}>
            <Text style={styles.amountDisplayLabel}>AMOUNT TO PAY VIA UPI</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.rupeeSign}>₹</Text>
              <TextInput
                style={styles.amountInputText}
                keyboardType="numeric"
                value={customAmount}
                onChangeText={(text) => {
                  setCustomAmount(text);
                  setSelectedDepositAmount('');
                }}
                placeholder="0"
                placeholderTextColor="#A0AEC0"
              />
            </View>
          </View>

          {/* Direct 1-Tap UPI Apps */}
          <Text style={styles.sectionLabel}>PAY WITH YOUR UPI APP</Text>
          <View style={styles.upiAppsGrid}>
            {[
              { name: 'Google Pay', icon: 'logo-google', color: '#EA4335' },
              { name: 'PhonePe', icon: 'flash', color: '#5F259F' },
              { name: 'Paytm UPI', icon: 'wallet', color: '#00BAF2' },
              { name: 'BHIM UPI', icon: 'qr-code', color: '#008479' },
            ].map((app) => (
              <TouchableOpacity
                key={app.name}
                style={styles.upiAppTile}
                onPress={() => handleOpenUpiApp(app.name)}
                activeOpacity={0.8}
              >
                <View style={[styles.appTileIcon, { backgroundColor: app.color }]}>
                  <Ionicons name={app.icon as any} size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.appTileName}>{app.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* UTR / Reference ID Verification Card */}
          <Text style={styles.sectionLabel}>ALREADY PAID? SUBMIT UTR REFERENCE</Text>
          <View style={styles.utrCard}>
            <Text style={styles.utrSubtext}>
              If funds haven't credited within 30 seconds, paste your 12-digit UTR from your bank/UPI app for instant reconciliation:
            </Text>

            <View style={styles.utrInputRow}>
              <TextInput
                style={styles.utrInput}
                placeholder="Enter 12-digit UPI UTR / Ref No."
                placeholderTextColor="#A0AEC0"
                value={utrNumber}
                onChangeText={setUtrNumber}
                keyboardType="numeric"
                maxLength={12}
              />
              <TouchableOpacity
                style={styles.utrVerifyBtn}
                onPress={handleVerifyUtr}
                activeOpacity={0.8}
              >
                <Text style={styles.utrVerifyBtnText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Security & Regulatory Footnote */}
          <View style={styles.securityBanner}>
            <Ionicons name="shield-checkmark" size={18} color="#05CD99" />
            <View style={{ flex: 1 }}>
              <Text style={styles.securityTitle}>NPCI & FIU-IND Compliant</Text>
              <Text style={styles.securitySub}>
                All payments flow through 256-bit encrypted escrow with automated reconciliation.
              </Text>
            </View>
          </View>
        </ScrollView>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(247, 249, 255, 0.45)',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 46,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(238, 242, 246, 0.8)',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
  },
  headerTitleCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1B2559',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 2,
  },
  headerBrandBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
  },
  headerLogoImage: {
    width: 26,
    height: 26,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.7,
    marginBottom: 8,
    marginTop: 6,
  },

  // VPA Hero Card
  vpaHeroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#4318FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  vpaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  vpaCardLabel: {
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  instantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 181, 71, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  instantPillText: {
    color: '#FFB547',
    fontSize: 10,
    fontWeight: '800',
  },
  vpaCopyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vpaAddress: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  vpaBank: {
    fontSize: 11,
    color: '#C7D2FE',
    marginTop: 3,
    fontWeight: '600',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  copyBtnDone: {
    backgroundColor: 'rgba(5, 205, 153, 0.25)',
    borderColor: 'rgba(5, 205, 153, 0.4)',
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },

  // Presets Row
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    flex: 1,
    minWidth: '28%',
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
  },
  presetChipActive: {
    backgroundColor: '#E6FAF5',
    borderColor: '#05CD99',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1B2559',
  },
  presetChipTextActive: {
    color: '#05CD99',
  },

  // Amount Display Card
  amountDisplayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    marginBottom: 16,
  },
  amountDisplayLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rupeeSign: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1B2559',
    marginRight: 6,
  },
  amountInputText: {
    flex: 1,
    fontSize: 28,
    fontWeight: '900',
    color: '#1B2559',
    padding: 0,
  },

  // UPI Apps Grid
  upiAppsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  upiAppTile: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
    gap: 6,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  appTileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTileName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B2559',
  },

  // UTR Card
  utrCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    marginBottom: 16,
  },
  utrSubtext: {
    fontSize: 11.5,
    color: '#707EAE',
    lineHeight: 16,
    marginBottom: 12,
  },
  utrInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  utrInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    color: '#1B2559',
  },
  utrVerifyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utrVerifyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Security Banner
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8EDF8',
  },
  securityTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  securitySub: {
    fontSize: 11,
    color: '#707EAE',
    marginTop: 2,
    lineHeight: 15,
  },

  // Segmented Tab Switcher
  tabSwitcherRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    gap: 6,
    marginBottom: 16,
  },
  switcherTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  switcherTabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  switcherTabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  switcherTabTextActive: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

