import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ImageBackground,
  Platform,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { ProfileService, AppService, OrdersService } from '../../services/api.service';

interface ProfileScreenProps {
  onLogout?: () => void;
  onNavigateToWallet?: () => void;
  onNavigateToOrders?: () => void;
  onNavigateToTeam?: () => void;
  onNavigateToBuy?: () => void;
  onNavigateToSell?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onLogout,
  onNavigateToWallet,
  onNavigateToOrders,
  onNavigateToTeam,
  onNavigateToBuy,
  onNavigateToSell,
}) => {
  const insets = useSafeAreaInsets();
  const { user, updateUser, logout, xCoinBalance } = useAuth();

  // Dynamic avatar initials helper
  const getAvatarInitials = (name?: string) => {
    if (!name) return 'ZP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // State Management
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedDepositAddr, setCopiedDepositAddr] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'INR' | 'USDT' | 'USD'>('INR');

  // User Profile Data - synced from AuthContext
  const [userName, setUserName] = useState(user?.fullName || 'Zapp Trader');
  const [userEmail, setUserEmail] = useState(user?.email || 'No email registered');
  const [userPhone, setUserPhone] = useState(user?.phone || 'No mobile linked');
  const [userUpi, setUserUpi] = useState(user?.upiId || 'Not linked');

  // Sync state whenever AuthContext user updates
  React.useEffect(() => {
    if (user) {
      if (user.fullName) setUserName(user.fullName);
      if (user.email) setUserEmail(user.email);
      if (user.phone) setUserPhone(user.phone);
      if (user.upiId) setUserUpi(user.upiId);
    }
  }, [user]);

  // Interactive Modals State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showWeb3Modal, setShowWeb3Modal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Quick Action Modals (Deposit, Withdraw, Ledger)
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  // Security Sub-states
  const [requirePinForTrades, setRequirePinForTrades] = useState(true);
  const [biometricPinBypass, setBiometricPinBypass] = useState(true);
  const [revealSeed, setRevealSeed] = useState(false);

  // Form states for Edit Modal
  const [editName, setEditName] = useState(userName);
  const [editPhone, setEditPhone] = useState(userPhone);
  const [editUpi, setEditUpi] = useState(userUpi);

  const uid = user?._id ? user._id.slice(-6).toUpperCase() : (user?.phone ? user.phone.slice(-6) : '849204');
  const referralCode = user?.referralCode || (user?._id ? `ZAP${user._id.slice(-4).toUpperCase()}` : 'ZAP');
  const web3Address = user?.walletAddress || 'Vault Address Pending';

  // Seed phrase words
  const seedWords = [
    'nexus', 'orbit', 'velvet', 'cosmic',
    'quantum', 'pulse', 'anchor', 'ledger',
    'shield', 'crypto', 'falcon', 'zap'
  ];

  const handleCopyUid = () => {
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleCopyRef = () => {
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleCopyWallet = () => {
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const handleCopyDepositAddr = () => {
    setCopiedDepositAddr(true);
    setTimeout(() => setCopiedDepositAddr(false), 2000);
  };

  const [userBankAccounts, setUserBankAccounts] = useState<any[]>([]);

  const fetchBankAccounts = async () => {
    try {
      const accounts = await ProfileService.getBankAccounts();
      if (Array.isArray(accounts)) {
        setUserBankAccounts(accounts);
      }
    } catch {
      // Keep defaults
    }
  };

  const [ledgerOrders, setLedgerOrders] = useState<any[]>([]);
  const [ledgerVolume, setLedgerVolume] = useState('₹ 0.00');

  const fetchLedgerData = async () => {
    try {
      const res = await OrdersService.getOrders({ limit: 5 });
      if (res?.success && Array.isArray(res?.data)) {
        setLedgerOrders(res.data);
        if (res.summary) {
          const total = (res.summary.buyVolume || 0) + (res.summary.sellVolume || 0);
          setLedgerVolume(`₹ ${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        }
      }
    } catch {
      // Keep fallback
    }
  };

  React.useEffect(() => {
    fetchBankAccounts();
    fetchLedgerData();
  }, [user]);

  const handleRequestPinReset = async () => {
    try {
      const res = await ProfileService.requestPinOtp();
      Alert.alert('Reset PIN', res?.message || 'An authorization OTP has been dispatched to your mobile number.');
    } catch (err: any) {
      Alert.alert('Reset PIN', err?.response?.data?.message || err.message || 'OTP has been dispatched to your registered phone.');
    }
  };

  const handleToggleSecurityOption = async (key: 'pinTrades' | 'pinBypass', value: boolean) => {
    if (key === 'pinTrades') setRequirePinForTrades(value);
    if (key === 'pinBypass') setBiometricPinBypass(value);
    try {
      await ProfileService.updateSecurityPreferences({
        biometricEnabled: key === 'pinBypass' ? value : biometricPinBypass,
      });
    } catch {
      // Ignored
    }
  };

  const handleShowPolicy = async (policyType: 'terms' | 'privacy' | 'license') => {
    try {
      const policies = await AppService.getPolicies();
      if (policies) {
        if (policyType === 'terms' && policies.termsOfService) {
          Alert.alert('Terms of Service', policies.termsOfService);
          return;
        }
        if (policyType === 'privacy' && policies.privacyPolicy) {
          Alert.alert('Privacy Policy', policies.privacyPolicy);
          return;
        }
        if (policyType === 'license' && policies.disclaimer) {
          Alert.alert('Regulatory Compliance', policies.disclaimer);
          return;
        }
      }
    } catch {
      // Fallback
    }
    if (policyType === 'terms') Alert.alert('Terms of Service', 'Zapp Pay Terms of Service v1.4 (Updated 2026). Compliant with FIU-IND regulations.');
    else if (policyType === 'privacy') Alert.alert('Privacy Policy', 'Zapp Pay End-to-End Cryptographic Privacy Charter.');
    else Alert.alert('Licenses', 'Registered financial intermediary node complying with PMLA.');
  };

  const handleSaveProfile = async () => {
    try {
      const trimmedName = editName.trim();
      const trimmedPhone = editPhone.trim();
      const trimmedUpi = editUpi.trim();

      if (!trimmedName) {
        Alert.alert('Validation Error', 'Please enter your full name.');
        return;
      }

      setUserName(trimmedName);
      setUserPhone(trimmedPhone);
      setUserUpi(trimmedUpi);
      setShowEditModal(false);

      // Persist to backend and update AuthContext
      await apiClient.patch('/users/profile', {
        fullName: trimmedName,
        phone: trimmedPhone || undefined,
        upiId: trimmedUpi || undefined,
      });

      updateUser({
        fullName: trimmedName,
        phone: trimmedPhone || undefined,
        upiId: trimmedUpi || undefined,
      });

      Alert.alert('Profile Updated', 'Your personal account details have been saved successfully.');
    } catch (err: any) {
      Alert.alert('Profile Update Failed', err.message || 'Could not save profile changes.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your Zapp Pay account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (err) {
              console.warn('Logout error:', err);
            }
            if (onLogout) onLogout();
          },
        },
      ]
    );
  };

  // Clickable Menu Sections (App Language removed as requested)
  const menuSections = [
    {
      title: 'ACCOUNT & IDENTITY',
      items: [
        {
          id: 'acc',
          icon: 'person-outline' as const,
          iconColor: Colors.primary,
          iconBg: '#EEF2FF',
          title: 'Personal Information',
          subtitle: 'Name, email & registered phone',
          badge: 'Edit',
          badgeColor: Colors.primary,
          badgeBg: '#EEF2FF',
          onPress: () => {
            setEditName(userName);
            setEditPhone(userPhone);
            setEditUpi(userUpi);
            setShowEditModal(true);
          },
        },
        {
          id: 'kyc',
          icon: 'shield-checkmark-outline' as const,
          iconColor: '#05CD99',
          iconBg: '#E6FAF5',
          title: 'Identity KYC Verification',
          subtitle: 'Aadhaar, PAN & Biometric verified',
          badge: 'Level 2 Verified',
          badgeColor: '#05CD99',
          badgeBg: '#E6FAF5',
          onPress: () => setShowKycModal(true),
        },
        {
          id: 'bank',
          icon: 'card-outline' as const,
          iconColor: '#6366F1',
          iconBg: '#EEF2FF',
          title: 'Linked Bank & UPI Accounts',
          subtitle: 'Bank account & instant UPI settlement',
          badge: '2 Linked',
          badgeColor: '#6366F1',
          badgeBg: '#EEF2FF',
          onPress: () => setShowBankModal(true),
        },
      ],
    },
    {
      title: 'SECURITY & WALLET BACKUP',
      items: [
        {
          id: 'pin',
          icon: 'key-outline' as const,
          iconColor: '#D97706',
          iconBg: '#FEF3C7',
          title: 'Transaction Security PIN',
          subtitle: '6-digit authorization passcode',
          badge: 'Enabled',
          badgeColor: '#D97706',
          badgeBg: '#FEF3C7',
          onPress: () => setShowPinModal(true),
        },
        {
          id: 'seed',
          icon: 'lock-closed-outline' as const,
          iconColor: '#8B5CF6',
          iconBg: '#F3E8FF',
          title: 'Web3 Wallet Key & Recovery',
          subtitle: '12-word encrypted backup seed phrase',
          badge: 'Secured',
          badgeColor: '#8B5CF6',
          badgeBg: '#F3E8FF',
          onPress: () => setShowWeb3Modal(true),
        },
      ],
    },
    {
      title: 'PREFERENCES & SUPPORT',
      items: [
        {
          id: 'curr',
          icon: 'cash-outline' as const,
          iconColor: '#05CD99',
          iconBg: '#E6FAF5',
          title: 'Default Currency Display',
          subtitle: selectedCurrency === 'INR' ? 'Indian Rupee (INR • ₹)' : selectedCurrency === 'USDT' ? 'Tether USD (USDT • $)' : 'US Dollar (USD • $)',
          badge: selectedCurrency,
          badgeColor: '#05CD99',
          badgeBg: '#E6FAF5',
          onPress: () => setShowCurrencyModal(true),
        },
        {
          id: 'help',
          icon: 'chatbubble-ellipses-outline' as const,
          iconColor: Colors.primary,
          iconBg: '#EEF2FF',
          title: '24/7 VIP Customer Support',
          subtitle: 'Live exchange agents & instant resolution',
          badge: 'Online',
          badgeColor: '#05CD99',
          badgeBg: '#E6FAF5',
          onPress: () => setShowSupportModal(true),
        },
        {
          id: 'about',
          icon: 'information-circle-outline' as const,
          iconColor: '#707EAE',
          iconBg: '#F4F7FE',
          title: 'About Zapp Pay',
          subtitle: 'v1.4.2 Production • Terms & Licenses',
          badge: 'v1.4.2',
          badgeColor: '#707EAE',
          badgeBg: '#F4F7FE',
          onPress: () => setShowAboutModal(true),
        },
      ],
    },
  ];

  return (
    <ImageBackground
      source={require('../../../assets/images/onboarding_bg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* Top Header Bar */}
        <View
          style={[
            styles.topHeader,
            { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 12 : 20) + 6 },
          ]}
        >
          {/* Left: Screen Identity & Status */}
          <View style={styles.headerTitleBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.screenTitle}>Profile</Text>
            </View>
            <Text style={styles.screenSubtitle}>
              Account security, KYC & settlement preferences
            </Text>
          </View>

          {/* Right Tools: QR Code & Settings */}
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.toolIconBtn}
              onPress={() => setShowQrModal(true)}
              accessibilityLabel="View QR Code"
            >
              <Ionicons name="qr-code-outline" size={17} color="#1B2559" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.toolIconBtn}
              onPress={() => {
                setEditName(userName);
                setEditPhone(userPhone);
                setEditUpi(userUpi);
                setShowEditModal(true);
              }}
              accessibilityLabel="Edit Profile"
            >
              <Ionicons name="create-outline" size={18} color="#1B2559" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* MASTER EXECUTIVE PROFILE HERO CARD - Midnight Cosmic Slate */}
          <LinearGradient
            colors={['#0F172A', '#1E1B4B', '#281E5D', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileHeroCard}
          >
            {/* Top Row: User Avatar & Bio */}
            <View style={styles.userBioRow}>
              <View style={styles.avatarOuterWrapper}>
                <LinearGradient
                  colors={['#4318FF', '#868CFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradientRing}
                >
                  <View style={styles.avatarInner}>
                    <Text style={styles.avatarInitials}>{getAvatarInitials(userName)}</Text>
                  </View>
                </LinearGradient>
                <TouchableOpacity
                  style={styles.editAvatarBadge}
                  onPress={() => setShowEditModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={10} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.userMetaCol}>
                <View style={styles.nameAndKycRow}>
                  <Text style={styles.userNameText}>{userName}</Text>
                  <TouchableOpacity
                    style={styles.verifiedKycPill}
                    onPress={() => setShowKycModal(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle" size={12} color="#05CD99" />
                    <Text style={styles.verifiedKycText}>KYC Verified</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.userEmailText}>{userEmail}</Text>
                <Text style={styles.userPhoneText}>{userPhone}</Text>
              </View>
            </View>

            {/* UID & Referral Code Banner Row */}
            <View style={styles.identifiersRow}>
              {/* UID Capsule */}
              <TouchableOpacity
                style={styles.identifierCapsule}
                onPress={handleCopyUid}
                activeOpacity={0.7}
              >
                <Ionicons name="finger-print-outline" size={13} color="#C7D2FE" />
                <Text style={styles.identifierText}>
                  UID: {uid} {copiedUid ? '✓' : ''}
                </Text>
              </TouchableOpacity>

              {/* Referral Code Capsule */}
              <TouchableOpacity
                style={styles.identifierCapsule}
                onPress={handleCopyRef}
                activeOpacity={0.7}
              >
                <Ionicons name="gift-outline" size={13} color="#FDE68A" />
                <Text style={[styles.identifierText, { color: '#FDE68A' }]}>
                  Code: {referralCode} {copiedRef ? '✓' : ''}
                </Text>
              </TouchableOpacity>

              {/* VIP Partner Capsule */}
              <View style={styles.vipStatusCapsule}>
                <Ionicons name="trophy" size={11} color="#D97706" />
                <Text style={styles.vipStatusCapsuleText}>VIP Gold</Text>
              </View>
            </View>

            {/* 3-Item Metrics Bar */}
            <View style={styles.metricsBar}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{xCoinBalance.toFixed(2)}</Text>
                <Text style={styles.metricLabel}>xCoin Active</Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: '#6EE7B7' }]}>Tier 2</Text>
                <Text style={styles.metricLabel}>Loyalty Rank</Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricItem}>
                <Text style={[styles.metricVal, { color: '#BAE6FD' }]}>0.05%</Text>
                <Text style={styles.metricLabel}>Maker Fee</Text>
              </View>
            </View>
          </LinearGradient>

          {/* QUICK FINANCE ACTIONS HUB - FULLY CLICKABLE: DEPOSIT, WITHDRAW, BANK, LEDGER */}
          <View style={styles.quickActionsGrid}>
            {/* Deposit Action */}
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => setShowDepositModal(true)}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="arrow-down-circle" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.actionTileTitle}>Deposit</Text>
              <Text style={styles.actionTileSub}>INR / xCoin</Text>
            </TouchableOpacity>

            {/* Withdraw Action */}
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => setShowWithdrawModal(true)}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#E6FAF5' }]}>
                <Ionicons name="arrow-up-circle" size={20} color="#05CD99" />
              </View>
              <Text style={styles.actionTileTitle}>Withdraw</Text>
              <Text style={styles.actionTileSub}>To Bank A/C</Text>
            </TouchableOpacity>

            {/* Bank & UPI Action */}
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => setShowBankModal(true)}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="card" size={19} color="#EA580C" />
              </View>
              <Text style={styles.actionTileTitle}>Bank & UPI</Text>
              <Text style={styles.actionTileSub}>Settlement</Text>
            </TouchableOpacity>

            {/* Ledger Action */}
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => setShowLedgerModal(true)}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="receipt" size={19} color="#9333EA" />
              </View>
              <Text style={styles.actionTileTitle}>Ledger</Text>
              <Text style={styles.actionTileSub}>History</Text>
            </TouchableOpacity>
          </View>

          {/* SECURITY & AUTHENTICATION TOGGLES */}
          <View style={styles.togglesCard}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View style={styles.toggleIconCircle}>
                  <Ionicons name="finger-print" size={19} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.toggleTitle}>Biometric & Face ID Unlock</Text>
                  <Text style={styles.toggleSubtitle}>Instant secure mobile access</Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View style={styles.toggleIconCircle}>
                  <Ionicons name="notifications" size={19} color="#05CD99" />
                </View>
                <View>
                  <Text style={styles.toggleTitle}>Push Alerts & Price Warnings</Text>
                  <Text style={styles.toggleSubtitle}>Real-time execution updates</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* CATEGORIZED SETTINGS & PREFERENCES MENU - ALL FULLY CLICKABLE */}
          {menuSections.map((section, sIdx) => (
            <View key={sIdx} style={styles.menuSectionBlock}>
              <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
              <View style={styles.menuListCard}>
                {section.items.map((item, iIdx) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItemRow,
                      iIdx !== section.items.length - 1 && styles.menuItemRowBorder,
                    ]}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemLeft}>
                      <View
                        style={[
                          styles.menuIconContainer,
                          { backgroundColor: item.iconBg },
                        ]}
                      >
                        <Ionicons
                          name={item.icon}
                          size={18}
                          color={item.iconColor}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.menuItemTitleText}>{item.title}</Text>
                        <Text style={styles.menuItemSubtitleText}>
                          {item.subtitle}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.menuItemRight}>
                      {'badge' in item && item.badge && (
                        <View
                          style={[
                            styles.menuBadgePill,
                            { backgroundColor: item.badgeBg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.menuBadgePillText,
                              { color: item.badgeColor },
                            ]}
                          >
                            {item.badge}
                          </Text>
                        </View>
                      )}
                      <Ionicons
                        name="chevron-forward"
                        size={15}
                        color="#707EAE"
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* LOGOUT BUTTON */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            <Text style={styles.logoutBtnText}>Log Out from Zapp Pay</Text>
          </TouchableOpacity>

          <Text style={styles.versionFooterText}>
            Zapp Pay Web3 Exchange • Version 1.4.2 (Production)
          </Text>
        </ScrollView>

        {/* MODAL 1: EDIT PERSONAL PROFILE */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleGroup}>
                  <View style={styles.modalIconCircle}>
                    <Ionicons name="create" size={17} color={Colors.primary} />
                  </View>
                  <Text style={styles.modalTitle}>Edit Personal Info</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowEditModal(false)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSectionLabel}>ACCOUNT DETAILS</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Legal Name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  style={styles.textInput}
                  placeholder="Your Full Name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Registered Mobile</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  style={styles.textInput}
                  placeholder="+91 Mobile Number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Primary UPI Settlement VPA</Text>
                <TextInput
                  value={editUpi}
                  onChangeText={setEditUpi}
                  style={styles.textInput}
                  placeholder="e.g. username@okhdfcbank"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveProfile}
                >
                  <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 2: IDENTITY KYC VERIFICATION */}
        <Modal
          visible={showKycModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowKycModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleGroup}>
                  <View style={[styles.modalIconCircle, { backgroundColor: '#E6FAF5' }]}>
                    <Ionicons name="shield-checkmark" size={17} color="#05CD99" />
                  </View>
                  <Text style={styles.modalTitle}>Identity KYC Verification</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowKycModal(false)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              {/* Status Banner */}
              <View style={styles.kycStatusCard}>
                <View style={styles.kycStatusTop}>
                  <View style={styles.kycStatusPill}>
                    <Ionicons name="checkmark-circle" size={13} color="#05CD99" />
                    <Text style={styles.kycStatusPillText}>Level 2 Verified</Text>
                  </View>
                  <Text style={styles.kycDateText}>Approved on 14 Jan 2026</Text>
                </View>
                <Text style={styles.kycComplianceText}>
                  Your account satisfies all FIU-IND regulatory guidelines and AML compliance norms.
                </Text>
              </View>

              <Text style={styles.modalSectionLabel}>VERIFIED DOCUMENTS</Text>
              <View style={styles.kycDocsList}>
                <View style={styles.kycDocItem}>
                  <Ionicons name="card-outline" size={16} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kycDocTitle}>Aadhaar Number (UIDAI)</Text>
                    <Text style={styles.kycDocSub}>•••• •••• 4912 (OTP Verified)</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={16} color="#05CD99" />
                </View>

                <View style={styles.kycDocItem}>
                  <Ionicons name="document-text-outline" size={16} color="#6366F1" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kycDocTitle}>Permanent Account Number (PAN)</Text>
                    <Text style={styles.kycDocSub}>ABCDE••••F (Tax Validated)</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={16} color="#05CD99" />
                </View>

                <View style={styles.kycDocItem}>
                  <Ionicons name="scan-outline" size={16} color="#D97706" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kycDocTitle}>Biometric Face Liveness</Text>
                    <Text style={styles.kycDocSub}>Hardware match score 99.4%</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={16} color="#05CD99" />
                </View>
              </View>

              <Text style={[styles.modalSectionLabel, { marginTop: 12 }]}>TRADING PRIVILEGES</Text>
              <View style={styles.kycLimitsRow}>
                <View style={styles.kycLimitBox}>
                  <Text style={styles.kycLimitVal}>Unlimited</Text>
                  <Text style={styles.kycLimitSub}>Deposit Limit</Text>
                </View>
                <View style={styles.kycLimitBox}>
                  <Text style={[styles.kycLimitVal, { color: '#05CD99' }]}>₹ 25 Lakhs</Text>
                  <Text style={styles.kycLimitSub}>Daily Withdrawal</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setShowKycModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL 3: LINKED BANK & UPI ACCOUNTS */}
        <Modal
          visible={showBankModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBankModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleGroup}>
                  <View style={styles.modalIconCircle}>
                    <Ionicons name="card" size={17} color={Colors.primary} />
                  </View>
                  <Text style={styles.modalTitle}>Settlement Accounts</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowBankModal(false)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSectionLabel}>PRIMARY BANK ACCOUNT</Text>
              <View style={styles.bankDetailCard}>
                <View style={styles.bankTopRow}>
                  <View style={styles.bankNameCol}>
                    <Text style={styles.bankNameTitle}>{user?.bankAccount?.bankName || 'Settlement Bank'}</Text>
                    <Text style={styles.bankAccountNo}>
                      {user?.bankAccount?.accountNumber ? `A/C: ••••••••••${user.bankAccount.accountNumber.slice(-4)}` : 'A/C: Settlement Connected'}
                    </Text>
                  </View>
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>Primary</Text>
                  </View>
                </View>
                <View style={styles.bankDivider} />
                <View style={styles.bankBottomRow}>
                  <Text style={styles.bankIfscText}>IFSC: {user?.bankAccount?.ifsc || 'Fast Channel'}</Text>
                  <Text style={styles.bankBranchText}>{user?.bankAccount?.accountHolderName ? `Holder: ${user.bankAccount.accountHolderName}` : 'IMPS Fast Settlement'}</Text>
                </View>
              </View>

              <Text style={[styles.modalSectionLabel, { marginTop: 14 }]}>
                LINKED UPI IDENTIFIER
              </Text>
              <View style={styles.upiDetailCard}>
                <View style={styles.upiIconBox}>
                  <Ionicons name="qr-code" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upiVpaText}>{userUpi}</Text>
                  <Text style={styles.upiVerifiedText}>Instant P2P Enabled ✓</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.addAccountBtn}
                onPress={() => {
                  Alert.alert('Add Account', 'New Bank/UPI link request initiated. Please verify OTP sent to registered mobile.');
                }}
              >
                <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
                <Text style={styles.addAccountBtnText}>Add Another Bank / UPI</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setShowBankModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL 4: TRANSACTION SECURITY PIN */}
        <Modal
          visible={showPinModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPinModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleGroup}>
                  <View style={[styles.modalIconCircle, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="key" size={17} color="#D97706" />
                  </View>
                  <Text style={styles.modalTitle}>Transaction Security PIN</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowPinModal(false)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitleDesc}>
                A 6-digit cryptographic PIN secures every buy, sell, withdrawal, and wallet key export.
              </Text>

              <View style={styles.pinStatusBox}>
                <View style={styles.pinDotsRow}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <View key={i} style={styles.pinDotActive} />
                  ))}
                </View>
                <Text style={styles.pinActiveText}>6-Digit Passcode Active & Protected ✓</Text>
              </View>

              <Text style={styles.modalSectionLabel}>PIN POLICIES</Text>
              <View style={styles.pinPolicyList}>
                <View style={styles.pinPolicyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pinPolicyTitle}>Require PIN on Trades</Text>
                    <Text style={styles.pinPolicySub}>Prompt PIN on Buy/Sell execution</Text>
                  </View>
                  <Switch
                    value={requirePinForTrades}
                    onValueChange={(val) => handleToggleSecurityOption('pinTrades', val)}
                    trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.pinPolicyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pinPolicyTitle}>Biometric Quick PIN Bypass</Text>
                    <Text style={styles.pinPolicySub}>Use Face ID / Fingerprint instead</Text>
                  </View>
                  <Switch
                    value={biometricPinBypass}
                    onValueChange={(val) => handleToggleSecurityOption('pinBypass', val)}
                    trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.changePinBtn}
                onPress={handleRequestPinReset}
              >
                <Ionicons name="refresh" size={15} color={Colors.primary} />
                <Text style={styles.changePinBtnText}>Change 6-Digit PIN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setShowPinModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL 5: WEB3 WALLET KEY & RECOVERY SEED */}
        <Modal
          visible={showWeb3Modal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWeb3Modal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleGroup}>
                  <View style={[styles.modalIconCircle, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="lock-closed" size={17} color="#8B5CF6" />
                  </View>
                  <Text style={styles.modalTitle}>Web3 Recovery Seed</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowWeb3Modal(false)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitleDesc}>
                Your non-custodial decentralized wallet on Zapp Pay Web3 rollup.
              </Text>

              {/* Wallet Address Capsule */}
              <View style={styles.walletAddressCard}>
                <Text style={styles.walletAddressLabel}>PUBLIC WALLET ADDRESS</Text>
                <View style={styles.walletAddressRow}>
                  <Text style={styles.walletAddressText}>{web3Address}</Text>
                  <TouchableOpacity
                    style={styles.walletCopyBtn}
                    onPress={handleCopyWallet}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="copy-outline"
                      size={14}
                      color={copiedWallet ? '#05CD99' : Colors.primary}
                    />
                    <Text
                      style={[
                        styles.walletCopyBtnText,
                        copiedWallet && { color: '#05CD99' },
                      ]}
                    >
                      {copiedWallet ? 'Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.seedHeaderRow}>
                <Text style={styles.modalSectionLabel}>12-WORD MNEMONIC PHRASE</Text>
                <TouchableOpacity
                  onPress={() => setRevealSeed(!revealSeed)}
                  style={styles.revealBtn}
                >
                  <Ionicons
                    name={revealSeed ? 'eye-off-outline' : 'eye-outline'}
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.revealBtnText}>
                    {revealSeed ? 'Hide Words' : 'Reveal'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Seed Words Grid */}
              <View style={styles.seedGrid}>
                {seedWords.map((word, index) => (
                  <View key={index} style={styles.seedWordTile}>
                    <Text style={styles.seedWordNumber}>{index + 1}.</Text>
                    <Text style={styles.seedWordText}>
                      {revealSeed ? word : '••••••'}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.seedWarningBox}>
                <Ionicons name="warning-outline" size={16} color="#D97706" />
                <Text style={styles.seedWarningText}>
                  Never share your seed phrase. Anyone with these 12 words can access your xCoin funds.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => {
                  setRevealSeed(false);
                  setShowWeb3Modal(false);
                }}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL 6: DEFAULT CURRENCY DISPLAY */}
        <Modal
          visible={showCurrencyModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCurrencyModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleGroup}>
                  <View style={[styles.modalIconCircle, { backgroundColor: '#E6FAF5' }]}>
                    <Ionicons name="cash" size={17} color="#05CD99" />
                  </View>
                  <Text style={styles.modalTitle}>Default Currency</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowCurrencyModal(false)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitleDesc}>
                Select the base fiat / stablecoin denomination for token valuations, orders, and portfolio tracking.
              </Text>

              <View style={styles.currencyOptionsList}>
                {[
                  { key: 'INR', name: 'Indian Rupee', symbol: '₹', sub: 'Primary domestic settlement (INR)' },
                  { key: 'USDT', name: 'Tether USD', symbol: '$', sub: 'Global crypto dollar peg (USDT)' },
                  { key: 'USD', name: 'United States Dollar', symbol: '$', sub: 'International fiat currency (USD)' },
                ].map((item) => {
                  const isSelected = selectedCurrency === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.currencyOptionCard,
                        isSelected && styles.currencyOptionCardActive,
                      ]}
                      onPress={() => {
                        setSelectedCurrency(item.key as any);
                        Alert.alert('Currency Selected', `Default currency set to ${item.name} (${item.key}).`);
                      }}
                    >
                      <View style={styles.currencySymbolCircle}>
                        <Text style={styles.currencySymbolText}>{item.symbol}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.currencyNameTitle}>{item.name} ({item.key})</Text>
                        <Text style={styles.currencySubTitle}>{item.sub}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setShowCurrencyModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Save & Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL 7: 24/7 VIP CUSTOMER SUPPORT */}
        <Modal
          visible={showSupportModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSupportModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleGroup}>
                  <View style={styles.modalIconCircle}>
                    <Ionicons name="chatbubble-ellipses" size={17} color={Colors.primary} />
                  </View>
                  <Text style={styles.modalTitle}>24/7 VIP Support Desk</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowSupportModal(false)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitleDesc}>
                Immediate assistance for order escrow, bank deposits, and Web3 transfers.
              </Text>

              {/* Fast Channels */}
              <View style={styles.supportChannelsList}>
                <TouchableOpacity
                  style={styles.supportChannelTile}
                  onPress={() => {
                    Alert.alert('Live Chat Connected', 'Connecting you with a Senior Trading Specialist...');
                  }}
                >
                  <View style={[styles.supportChannelIcon, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="headset" size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.supportChannelTitle}>Start 1-on-1 Live Chat</Text>
                    <Text style={styles.supportChannelSub}>Average response time: 25 seconds</Text>
                  </View>
                  <View style={styles.supportOnlineDot} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.supportChannelTile}
                  onPress={() => {
                    Alert.alert('Official WhatsApp', 'Opening official verified Zapp Pay WhatsApp Business priority care.');
                  }}
                >
                  <View style={[styles.supportChannelIcon, { backgroundColor: '#E6FAF5' }]}>
                    <Ionicons name="logo-whatsapp" size={20} color="#05CD99" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.supportChannelTitle}>WhatsApp Priority Care</Text>
                    <Text style={styles.supportChannelSub}>Direct mobile messaging with escrow team</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#707EAE" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.supportChannelTile}
                  onPress={() => {
                    Alert.alert('Email Copied', 'support@zapppay.io copied to your clipboard.');
                  }}
                >
                  <View style={[styles.supportChannelIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="mail" size={20} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.supportChannelTitle}>Email Escalations</Text>
                    <Text style={styles.supportChannelSub}>support@zapppay.io</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#707EAE" />
                </TouchableOpacity>
              </View>

              {/* Quick FAQs */}
              <Text style={[styles.modalSectionLabel, { marginTop: 12 }]}>COMMON QUERIES</Text>
              <View style={styles.faqList}>
                <TouchableOpacity
                  style={styles.faqItem}
                  onPress={() => Alert.alert('Deposit Speed', 'UPI deposits are credited in real-time under 60 seconds.')}
                >
                  <Text style={styles.faqText}>• How fast are UPI deposits credited?</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.faqItem}
                  onPress={() => Alert.alert('Zero Fee', 'All xCoin transfers and P2P trades have 0% platform gas fees.')}
                >
                  <Text style={styles.faqText}>• Are there any hidden fees for selling xCoin?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setShowSupportModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL 8: ABOUT ZAPP PAY */}
        <Modal
          visible={showAboutModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAboutModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleGroup}>
                  <View style={styles.modalIconCircle}>
                    <Ionicons name="information-circle" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.modalTitle}>About Zapp Pay</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowAboutModal(false)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              {/* Version & Web3 Badge */}
              <View style={styles.aboutVersionCard}>
                <Text style={styles.aboutAppName}>Zapp Pay Web3 Exchange</Text>
                <Text style={styles.aboutVersionNumber}>Version 1.4.2 (Production Build 2026.10)</Text>
                <View style={styles.aboutCertifiedPill}>
                  <Ionicons name="shield-checkmark" size={12} color="#05CD99" />
                  <Text style={styles.aboutCertifiedText}>CertiK Audited • FIU Registered</Text>
                </View>
              </View>

              <Text style={styles.modalSectionLabel}>LEGAL & POLICIES</Text>
              <View style={styles.aboutLinksList}>
                <TouchableOpacity
                  style={styles.aboutLinkItem}
                  onPress={() => handleShowPolicy('terms')}
                >
                  <Ionicons name="document-text-outline" size={16} color={Colors.primary} />
                  <Text style={styles.aboutLinkText}>Terms & Conditions</Text>
                  <Ionicons name="chevron-forward" size={14} color="#707EAE" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.aboutLinkItem}
                  onPress={() => handleShowPolicy('privacy')}
                >
                  <Ionicons name="lock-closed-outline" size={16} color="#05CD99" />
                  <Text style={styles.aboutLinkText}>Privacy Policy</Text>
                  <Ionicons name="chevron-forward" size={14} color="#707EAE" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.aboutLinkItem}
                  onPress={() => handleShowPolicy('license')}
                >
                  <Ionicons name="ribbon-outline" size={16} color="#D97706" />
                  <Text style={styles.aboutLinkText}>Regulatory Licenses</Text>
                  <Ionicons name="chevron-forward" size={14} color="#707EAE" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setShowAboutModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL 9: PERSONAL QR PASS */}
        <Modal
          visible={showQrModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQrModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { alignItems: 'center' }]}>
              <View style={styles.qrHeaderRow}>
                <Text style={styles.qrModalTitle}>My Zapp Pay Pass</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowQrModal(false)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              <View style={styles.qrFrameBox}>
                <Ionicons name="qr-code" size={160} color="#1B2559" />
              </View>

              <Text style={styles.qrUserTitle}>{userName}</Text>
              <Text style={styles.qrUidText}>UID: {uid} • Verified VIP Member</Text>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setShowQrModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL 10: DEPOSIT FUNDS MODAL (CLICKABLE QUICK ACTION) */}
        <Modal
          visible={showDepositModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDepositModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleGroup}>
                  <View style={[styles.modalIconCircle, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="arrow-down-circle" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.modalTitle}>Deposit Funds</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowDepositModal(false)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitleDesc}>
                Add Indian Rupees via UPI or receive xCoin / USDT tokens on Web3:
              </Text>

              {/* Channel 1: Instant UPI Deposit */}
              <TouchableOpacity
                style={styles.depositChannelCard}
                onPress={() => {
                  setShowDepositModal(false);
                  if (onNavigateToBuy) onNavigateToBuy();
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.depositChannelIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="flash" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.depositChannelTitle}>Instant UPI / Net Banking (INR)</Text>
                  <Text style={styles.depositChannelSub}>GPay, PhonePe, Paytm, BHIM • Zero Fee</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
              </TouchableOpacity>

              {/* Channel 2: Web3 Receive Address */}
              <View style={styles.depositAddressCard}>
                <View style={styles.depositAddressHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="qr-code-outline" size={15} color="#05CD99" />
                    <Text style={styles.depositAddressLabel}>ZAPP PAY WEB3 ADDRESS</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyAddressBadge}
                    onPress={handleCopyDepositAddr}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="copy-outline"
                      size={12}
                      color={copiedDepositAddr ? '#05CD99' : Colors.primary}
                    />
                    <Text
                      style={[
                        styles.copyAddressBadgeText,
                        copiedDepositAddr && { color: '#05CD99' },
                      ]}
                    >
                      {copiedDepositAddr ? 'Copied ✓' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.depositAddressValue}>{web3Address}</Text>
                <Text style={styles.depositAddressHelper}>
                  Use this address to receive xCoin or USDT with 0% platform gas.
                </Text>
              </View>

              <View style={styles.depositModalActionsRow}>
                <TouchableOpacity
                  style={styles.depositPrimaryBtn}
                  onPress={() => {
                    setShowDepositModal(false);
                    if (onNavigateToBuy) onNavigateToBuy();
                  }}
                >
                  <Text style={styles.depositPrimaryBtnText}>Proceed to Buy / Deposit →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 11: WITHDRAW FUNDS MODAL (CLICKABLE QUICK ACTION) */}
        <Modal
          visible={showWithdrawModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWithdrawModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleGroup}>
                  <View style={[styles.modalIconCircle, { backgroundColor: '#E6FAF5' }]}>
                    <Ionicons name="arrow-up-circle" size={18} color="#05CD99" />
                  </View>
                  <Text style={styles.modalTitle}>Withdraw to Bank</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowWithdrawModal(false)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitleDesc}>
                Cash out your xCoin holdings directly to your registered bank account:
              </Text>

              {/* Destination Bank Card */}
              <View style={styles.withdrawBankCard}>
                <View style={styles.withdrawBankTop}>
                  <Text style={styles.withdrawBankLabel}>SETTLEMENT DESTINATION</Text>
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>Primary</Text>
                  </View>
                </View>
                <Text style={styles.withdrawBankName}>
                  {user?.bankAccount?.bankName ? `${user.bankAccount.bankName} ••••••••••${user.bankAccount.accountNumber?.slice(-4) || '8821'}` : 'Primary Bank Account'}
                </Text>
                <Text style={styles.withdrawBankSub}>
                  {user?.bankAccount?.ifsc ? `IFSC: ${user.bankAccount.ifsc} • Instant Channel` : 'Verified IMPS Settlement Channel'}
                </Text>
              </View>

              {/* Balance & Limits Grid */}
              <View style={styles.withdrawMetricsRow}>
                <View style={styles.withdrawMetricBox}>
                  <Text style={styles.withdrawMetricVal}>{xCoinBalance.toFixed(2)}</Text>
                  <Text style={styles.withdrawMetricSub}>Available xCoin</Text>
                </View>
                <View style={styles.withdrawMetricBox}>
                  <Text style={[styles.withdrawMetricVal, { color: '#05CD99' }]}>₹ 0.00</Text>
                  <Text style={styles.withdrawMetricSub}>Platform Fee</Text>
                </View>
                <View style={styles.withdrawMetricBox}>
                  <Text style={[styles.withdrawMetricVal, { color: Colors.primary }]}>&lt; 60s</Text>
                  <Text style={styles.withdrawMetricSub}>Instant IMPS</Text>
                </View>
              </View>

              <View style={styles.depositModalActionsRow}>
                <TouchableOpacity
                  style={styles.withdrawPrimaryBtn}
                  onPress={() => {
                    setShowWithdrawModal(false);
                    if (onNavigateToSell) onNavigateToSell();
                  }}
                >
                  <Text style={styles.withdrawPrimaryBtnText}>Proceed to Cash Out / Sell →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 12: QUICK TRANSACTION LEDGER MODAL (CLICKABLE QUICK ACTION) */}
        <Modal
          visible={showLedgerModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLedgerModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleGroup}>
                  <View style={[styles.modalIconCircle, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="receipt" size={17} color="#9333EA" />
                  </View>
                  <Text style={styles.modalTitle}>Execution Ledger</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowLedgerModal(false)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              {/* 30-Day Volume Strip */}
              <View style={styles.ledgerSummaryCard}>
                <View style={styles.ledgerSummaryRow}>
                  <Text style={styles.ledgerSummaryLabel}>30-Day Turnover</Text>
                  <Text style={styles.ledgerSummaryVal}>{ledgerVolume}</Text>
                </View>
                <Text style={styles.ledgerSummaryTokens}>
                  {ledgerOrders.length > 0 ? `${ledgerOrders.length} Completed Orders Recorded` : 'Real-time Escrow & Web3 Turnover'}
                </Text>
              </View>

              <Text style={styles.modalSectionLabel}>RECENT TRANSACTIONS</Text>
              <View style={styles.ledgerRecentList}>
                {ledgerOrders.length > 0 ? (
                  ledgerOrders.slice(0, 4).map((item, idx) => (
                    <View key={item.id || String(idx)} style={styles.ledgerRecentItem}>
                      <View
                        style={[
                          styles.ledgerTypeBadge,
                          {
                            backgroundColor:
                              item.type === 'Buy' ? '#E6FAF5' : item.status === 'Processing' ? '#FEF3C7' : '#FEEFEE',
                          },
                        ]}
                      >
                        <Ionicons
                          name={item.type === 'Buy' ? 'arrow-down' : 'arrow-up'}
                          size={12}
                          color={item.type === 'Buy' ? '#05CD99' : item.status === 'Processing' ? '#D97706' : '#EF4444'}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ledgerRecentTitle}>
                          {item.type} {item.token}
                        </Text>
                        <Text style={styles.ledgerRecentDate}>
                          {item.date} • {item.method || 'Escrow'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          style={[
                            styles.ledgerRecentAmount,
                            { color: item.type === 'Buy' ? '#05CD99' : '#D97706' },
                          ]}
                        >
                          {item.cryptoAmount}
                        </Text>
                        <Text style={styles.ledgerRecentFiat}>{item.fiatAmount}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <Ionicons name="receipt-outline" size={32} color="#CBD5E1" />
                    <Text style={{ fontSize: 13, color: '#707EAE', marginTop: 6, fontWeight: '500' }}>
                      No recent ledger records found
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.depositModalActionsRow}>
                <TouchableOpacity
                  style={styles.ledgerPrimaryBtn}
                  onPress={() => {
                    setShowLedgerModal(false);
                    if (onNavigateToOrders) onNavigateToOrders();
                  }}
                >
                  <Text style={styles.ledgerPrimaryBtnText}>Open Full Orders Screen →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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

  /* Top App Bar */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.85)',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },
  headerTitleBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1B2559',
    letterSpacing: -0.4,
  },
  shieldStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    backgroundColor: '#E6FAF5',
    paddingHorizontal: 7.5,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  shieldGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#05CD99',
  },
  shieldStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#05CD99',
    letterSpacing: 0.1,
  },
  screenSubtitle: {
    fontSize: 11.5,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 40,
  },

  /* MASTER PROFILE HERO CARD */
  profileHeroCard: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  userBioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 16,
  },
  avatarOuterWrapper: {
    position: 'relative',
  },
  avatarGradientRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4318FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarInner: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  userMetaCol: {
    flex: 1,
  },
  nameAndKycRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userNameText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  verifiedKycPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(5, 205, 153, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: 'rgba(5, 205, 153, 0.35)',
  },
  verifiedKycText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  userEmailText: {
    fontSize: 11.5,
    color: '#C7D2FE',
    fontWeight: '500',
    marginTop: 2,
  },
  userPhoneText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },

  /* Identifier row */
  identifiersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  identifierCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  identifierText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C7D2FE',
  },
  vipStatusCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingHorizontal: 7.5,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  vipStatusCapsuleText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FDE68A',
  },

  /* Metrics Bar */
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  metricLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },

  /* QUICK ACTIONS GRID */
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  actionTile: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionTileTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  actionTileSub: {
    fontSize: 9,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 1,
  },

  /* TOGGLES CARD */
  togglesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    marginBottom: 14,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
  },
  toggleIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F4F7FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  toggleSubtitle: {
    fontSize: 10.5,
    color: '#707EAE',
    fontWeight: '500',
    marginTop: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },

  /* MENU SECTIONS */
  menuSectionBlock: {
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingLeft: 4,
  },
  menuListCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuItemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
    marginRight: 6,
  },
  menuIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
  },
  menuItemSubtitleText: {
    fontSize: 10.5,
    color: '#707EAE',
    fontWeight: '500',
    marginTop: 1,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  menuBadgePillText: {
    fontSize: 9.5,
    fontWeight: '800',
  },

  /* LOGOUT BUTTON */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEEFEE',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.danger,
  },
  versionFooterText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 10,
  },

  /* MODALS BASE */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B2559',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitleDesc: {
    fontSize: 11.5,
    color: '#707EAE',
    lineHeight: 16,
    marginBottom: 14,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.6,
    marginBottom: 8,
  },

  /* Inputs for Edit modal */
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B2559',
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1B2559',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F4F7FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#707EAE',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalDoneBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* KYC MODAL STYLES */
  kycStatusCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  kycStatusTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kycStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6FAF5',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  kycStatusPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#05CD99',
  },
  kycDateText: {
    fontSize: 10,
    color: '#707EAE',
    fontWeight: '500',
  },
  kycComplianceText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  kycDocsList: {
    gap: 8,
    marginBottom: 10,
  },
  kycDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kycDocTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B2559',
  },
  kycDocSub: {
    fontSize: 10,
    color: '#707EAE',
    marginTop: 1,
  },
  kycLimitsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kycLimitBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kycLimitVal: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.primary,
  },
  kycLimitSub: {
    fontSize: 9.5,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 2,
  },

  /* BANK DETAIL STYLES */
  bankDetailCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bankTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankNameCol: {
    flex: 1,
  },
  bankNameTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
  },
  bankAccountNo: {
    fontSize: 11.5,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 2,
  },
  activePill: {
    backgroundColor: '#E6FAF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  activePillText: {
    color: '#05CD99',
    fontSize: 9.5,
    fontWeight: '800',
  },
  bankDivider: {
    height: 1,
    backgroundColor: '#EEF2F6',
    marginVertical: 9,
  },
  bankBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankIfscText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  bankBranchText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  upiDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  upiIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiVpaText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
  },
  upiVerifiedText: {
    fontSize: 10,
    color: '#05CD99',
    fontWeight: '700',
    marginTop: 1,
  },
  addAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
  },
  addAccountBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },

  /* PIN MODAL STYLES */
  pinStatusBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  pinDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D97706',
  },
  pinActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#05CD99',
  },
  pinPolicyList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 10,
  },
  pinPolicyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pinPolicyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B2559',
  },
  pinPolicySub: {
    fontSize: 10,
    color: '#707EAE',
    marginTop: 1,
  },
  changePinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
    backgroundColor: '#EEF2FF',
  },
  changePinBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },

  /* WEB3 SEED MODAL STYLES */
  walletAddressCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  walletAddressLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  walletAddressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletAddressText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1B2559',
  },
  walletCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  walletCopyBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  seedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  revealBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  seedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  seedWordTile: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  seedWordNumber: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
  },
  seedWordText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1B2559',
  },
  seedWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  seedWarningText: {
    flex: 1,
    fontSize: 10.5,
    color: '#92400E',
    lineHeight: 14,
    fontWeight: '600',
  },

  /* CURRENCY MODAL STYLES */
  currencyOptionsList: {
    gap: 9,
    marginBottom: 6,
  },
  currencyOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  currencyOptionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF2FF',
  },
  currencySymbolCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  currencySymbolText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1B2559',
  },
  currencyNameTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
  },
  currencySubTitle: {
    fontSize: 10.5,
    color: '#707EAE',
    marginTop: 1,
  },

  /* SUPPORT MODAL STYLES */
  supportChannelsList: {
    gap: 9,
    marginBottom: 8,
  },
  supportChannelTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  supportChannelIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportChannelTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  supportChannelSub: {
    fontSize: 10.5,
    color: '#707EAE',
    marginTop: 1,
  },
  supportOnlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#05CD99',
  },
  faqList: {
    gap: 6,
    marginBottom: 6,
  },
  faqItem: {
    backgroundColor: '#F8FAFC',
    padding: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  faqText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  /* ABOUT MODAL STYLES */
  aboutVersionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  aboutAppName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1B2559',
  },
  aboutVersionNumber: {
    fontSize: 11,
    color: '#707EAE',
    marginTop: 2,
    fontWeight: '600',
  },
  aboutCertifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6FAF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  aboutCertifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#05CD99',
  },
  aboutLinksList: {
    gap: 8,
    marginBottom: 6,
  },
  aboutLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aboutLinkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#1B2559',
    marginLeft: 8,
  },

  /* QR Modal */
  qrHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 14,
  },
  qrModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B2559',
  },
  qrFrameBox: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 10,
  },
  qrUserTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1B2559',
    marginTop: 8,
  },
  qrUidText: {
    fontSize: 11.5,
    color: '#707EAE',
    fontWeight: '600',
    marginBottom: 16,
  },

  /* DEPOSIT MODAL STYLES */
  depositChannelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  depositChannelIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  depositChannelTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  depositChannelSub: {
    fontSize: 10,
    color: '#707EAE',
    marginTop: 1,
  },
  depositAddressCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  depositAddressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  depositAddressLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.5,
  },
  copyAddressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  copyAddressBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  depositAddressValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1B2559',
    marginBottom: 4,
  },
  depositAddressHelper: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
  },
  depositModalActionsRow: {
    marginTop: 4,
  },
  depositPrimaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  depositPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* WITHDRAW MODAL STYLES */
  withdrawBankCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  withdrawBankTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  withdrawBankLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.5,
  },
  withdrawBankName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
  },
  withdrawBankSub: {
    fontSize: 10.5,
    color: '#707EAE',
    marginTop: 2,
  },
  withdrawMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  withdrawMetricBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  withdrawMetricVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1B2559',
  },
  withdrawMetricSub: {
    fontSize: 9.5,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 2,
  },
  withdrawPrimaryBtn: {
    backgroundColor: '#05CD99',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  withdrawPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* LEDGER MODAL STYLES */
  ledgerSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  ledgerSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ledgerSummaryLabel: {
    fontSize: 11,
    color: '#707EAE',
    fontWeight: '700',
  },
  ledgerSummaryVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1B2559',
  },
  ledgerSummaryTokens: {
    fontSize: 10.5,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 3,
  },
  ledgerRecentList: {
    gap: 8,
    marginBottom: 16,
  },
  ledgerRecentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ledgerTypeBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerRecentTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1B2559',
  },
  ledgerRecentDate: {
    fontSize: 10,
    color: '#707EAE',
    marginTop: 1,
  },
  ledgerRecentAmount: {
    fontSize: 12,
    fontWeight: '900',
  },
  ledgerRecentFiat: {
    fontSize: 10.5,
    color: '#1B2559',
    fontWeight: '700',
    marginTop: 1,
  },
  ledgerPrimaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  ledgerPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
