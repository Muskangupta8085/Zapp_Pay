import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Share,
  ImageBackground,
  Image,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { TeamService, HomeService } from '../../services/api.service';

interface TeamScreenProps {
  onBack?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToWallet?: () => void;
}

interface TeamMember {
  id: string;
  name: string;
  code: string;
  level: 'Level 1' | 'Level 2';
  levelLabel: string;
  joined: string;
  commission: string;
  commissionRaw: number;
  tradeVolume: string;
  status: 'Active' | 'Top Trader' | 'Trading Now';
  avatarBg: string;
  avatarText: string;
  isOnline: boolean;
}

export const TeamScreen: React.FC<TeamScreenProps> = ({
  onBack,
  onNavigateToProfile,
  onNavigateToWallet,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const displayName = user?.fullName || 'Trader';

  // Dynamic avatar initials helper
  const getAvatarInitials = (name?: string) => {
    if (!name) return 'ZP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  const avatarInitials = getAvatarInitials(user?.fullName);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [hideEarnings, setHideEarnings] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'L1' | 'L2' | 'Top'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [unclaimedAmount, setUnclaimedAmount] = useState('0.00');
  const [hasClaimed, setHasClaimed] = useState(false);
  const [referralMode, setReferralMode] = useState<'Code' | 'Link'>('Code');
  const [selectedCalcTier, setSelectedCalcTier] = useState<number>(1);

  const [teamOverview, setTeamOverview] = useState({
    totalMembers: 0,
    l1Count: 0,
    l2Count: 0,
    totalCommissions: '0.00 xCoin',
    totalCommissionsRaw: 0,
    fiatCommissions: '₹ 0.00',
    unclaimedAmount: '0.00',
    referralCode: user?.referralCode || (user?._id ? `ZAP${user._id.slice(-4).toUpperCase()}` : 'ZAP'),
    referralLink: `https://zapppay.io/join?ref=${user?.referralCode || 'ZAP'}`,
  });

  const referralCode = teamOverview.referralCode || user?.referralCode || (user?._id ? `ZAP${user._id.slice(-4).toUpperCase()}` : 'ZAP');
  const referralLink = teamOverview.referralLink || `https://zapppay.io/join?ref=${referralCode}`;

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [xCoinRate, setXCoinRate] = useState(108.37);

  const fetchTeamData = async () => {
    try {
      setIsLoadingMembers(true);
      const [data, tickers] = await Promise.all([
        TeamService.getOverview().catch(() => null),
        HomeService.getTickers().catch(() => null),
      ]);
      if (tickers && Array.isArray(tickers)) {
        const zap = tickers.find((t: any) => t.id === 'xcoin')?.rawPrice;
        if (zap) setXCoinRate(zap);
      }
      if (data) {
        if (data.overview) {
          setTeamOverview({
            totalMembers: data.overview.totalMembers || 0,
            l1Count: data.overview.l1Count || 0,
            l2Count: data.overview.l2Count || 0,
            totalCommissions: data.overview.totalCommissions || '0.00 xCoin',
            totalCommissionsRaw: data.overview.totalCommissionsRaw || 0,
            fiatCommissions: data.overview.fiatCommissions || '₹ 0.00',
            unclaimedAmount: data.overview.unclaimedAmount || '0.00',
            referralCode: data.overview.referralCode || user?.referralCode || 'ZAP',
            referralLink: data.overview.referralLink || `https://zapppay.io/join?ref=${user?.referralCode || 'ZAP'}`,
          });
          setUnclaimedAmount(data.overview.unclaimedAmount || '0.00');
        }
        if (Array.isArray(data.members)) {
          setTeamMembers(data.members);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingMembers(false);
    }
  };

  React.useEffect(() => {
    fetchTeamData();
  }, [user]);

  const handleCopyCode = () => {
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({
        title: 'Join Zapp Pay Crypto Exchange',
        message: `Trade crypto with lightning speed on Zapp Pay! Use my VIP partner referral code "${referralCode}" to get up to 20% cashback on trading fees: ${referralLink}`,
      });
    } catch {
      Alert.alert('Share Link', referralLink);
    }
  };

  const handleSocialShare = (platform: 'WhatsApp' | 'Telegram' | 'Twitter') => {
    Alert.alert(
      `Share via ${platform}`,
      `Ready to invite via ${platform}!\n\nPartner Code: ${referralCode}\nLink: ${referralLink}`,
      [
        { text: 'Copy Link & Open', onPress: handleCopyLink },
        { text: 'Dismiss', style: 'cancel' },
      ]
    );
  };

  const handleMemberAction = (member: TeamMember) => {
    setSelectedMember(member);
  };

  const handleConfirmClaim = async () => {
    try {
      const res = await TeamService.claimCommission();
      if (res?.success) {
        setHasClaimed(true);
        setUnclaimedAmount('0.00');
        setShowClaimModal(false);
        Alert.alert(
          '🎉 Commission Claimed!',
          res.message || `${unclaimedAmount} xCoin has been successfully deposited into your primary Zapp Pay wallet with 0 network gas fees.`,
          [
            {
              text: 'View in Wallet',
              onPress: () => onNavigateToWallet && onNavigateToWallet(),
            },
            { text: 'Awesome', style: 'default' },
          ]
        );
        await fetchTeamData();
      } else {
        Alert.alert('Claim Commission', res?.message || 'No pending commission to claim.');
      }
    } catch (err: any) {
      Alert.alert('Claim Commission', err?.response?.data?.message || err.message || 'Claim processed.');
    }
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      if (activeTab === 'L1' && m.level !== 'Level 1') return false;
      if (activeTab === 'L2' && m.level !== 'Level 2') return false;
      if (activeTab === 'Top' && m.commissionRaw < 250) return false;

      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(query) ||
          m.code.toLowerCase().includes(query) ||
          m.status.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [activeTab, searchQuery]);

  // Calculator simulations
  const calcTiers = [
    { label: '₹ 5 Lakh Vol', volume: '₹ 5,00,000', rebate: '₹ 6,250 / mo', xCoin: `${Math.round(6250 / xCoinRate)} xCoin` },
    { label: '₹ 25 Lakh Vol', volume: '₹ 25,00,000', rebate: '₹ 31,250 / mo', xCoin: `${Math.round(31250 / xCoinRate)} xCoin` },
    { label: '₹ 1 Cr Vol', volume: '₹ 1,00,00,000', rebate: '₹ 1,25,000 / mo', xCoin: `${Math.round(125000 / xCoinRate).toLocaleString()} xCoin` },
  ];

  return (
    <ImageBackground
      source={require('../../../assets/images/onboarding_bg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* Top Header Bar - Optimized for Mobile Screens with Dynamic Safe Area */}
        <View
          style={[
            styles.topHeader,
            { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 12 : 20) + 6 },
          ]}
        >
          {/* Left: Back button (if present) + User Profile Gateway */}
          <View style={styles.headerLeftCluster}>
            {onBack && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityLabel="Back"
              >
                <Ionicons name="arrow-back" size={19} color="#1B2559" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={onNavigateToProfile}
              style={styles.userProfileTouchable}
              accessibilityRole="button"
              accessibilityLabel="View Profile"
            >
              {/* Avatar with Gradient Ring and Live Indicator */}
              <View style={styles.avatarWrapper}>
                <LinearGradient
                  colors={['#4318FF', '#868CFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradientRing}
                >
                  <View style={styles.avatarInner}>
                    <Text style={styles.avatarText}>{avatarInitials}</Text>
                  </View>
                </LinearGradient>
                <View style={styles.onlineDot} />
              </View>

              {/* User Meta Information Stack */}
              <View style={styles.userMetaContainer}>
                <View style={styles.greetingRow}>
                  <Text style={styles.greetingPrefix} numberOfLines={1}>
                    VIP Partner Desk 🌟
                  </Text>
                </View>

                <View style={styles.userNameRow}>
                  <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                    {displayName}
                  </Text>
                  <View style={styles.verifiedCheckBadge}>
                    <Ionicons name="checkmark" size={9} color="#05CD99" />
                  </View>
                </View>

                {/* Ambassador Tier Status Capsule */}
                <View style={styles.kycRow}>
                  <View style={styles.vipMiniBadge}>
                    <Text style={styles.vipMiniText}>{user?.role === 'admin' ? 'SUPER' : 'GOLD'}</Text>
                  </View>
                  <Text style={styles.kycBadgeText} numberOfLines={1} ellipsizeMode="tail">
                    Tier 1 • {teamMembers.length} Members
                  </Text>
                  <Ionicons name="chevron-forward" size={10} color="#707EAE" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Right Mobile Actions Hub */}
          <View style={styles.headerRightActions}>
            {/* Quick QR Pass Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.actionIconBtn}
              onPress={() => setShowQrModal(true)}
              accessibilityLabel="View QR Pass"
            >
              <Ionicons name="qr-code-outline" size={17} color="#1B2559" />
            </TouchableOpacity>

            {/* Perks & Rules Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.actionIconBtn, styles.perksIconBtn]}
              onPress={() => setShowRulesModal(true)}
              accessibilityLabel="Partner Perks"
            >
              <Ionicons name="trophy" size={16} color="#D97706" />
            </TouchableOpacity>


          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* MASTER VIP AFFILIATE CARD - Cosmic Midnight Design */}
          <LinearGradient
            colors={['#0F1538', '#161B4F', '#1F2578', '#2F2188']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Header Row: Total Commission + Web3 Network Badge */}
            <View style={styles.cosmicCardHeader}>
              <View style={styles.cosmicHeaderLeft}>
                <Ionicons name="people-circle-outline" size={26} color="#FFFFFF" style={styles.walletHeaderIcon} />
                <View style={styles.headerTextGroup}>
                  <Text style={styles.cosmicHeaderTitle}>Cumulative Commission</Text>
                  <Text style={styles.cosmicHeaderSubtitle}>
                    VIP Partner Treasury Overview
                  </Text>
                </View>
              </View>

              {/* Zapp Pay Partner Web3 Badge */}
              <View style={styles.web3NetworkBadge}>
                <Ionicons name="globe-outline" size={13} color="#C7D2FE" />
                <Text style={styles.web3NetworkBadgeText}>Zapp Pay Web3</Text>
                <View style={styles.web3LiveGreenDot} />
              </View>
            </View>

            {/* Main Balance Figures Row: 3D Gold Coin + Amounts + Claim Card */}
            <View style={styles.balanceMainRow}>
              <View style={styles.balanceLeftSection}>
                {/* 3D Stylized Gold 'Z' Coin */}
                <View style={styles.goldCoinOuter}>
                  <LinearGradient
                    colors={['#F59E0B', '#FDE047', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.goldCoinRing}
                  >
                    <LinearGradient
                      colors={['#FBBF24', '#F59E0B', '#B45309']}
                      start={{ x: 0.2, y: 0.1 }}
                      end={{ x: 0.8, y: 0.9 }}
                      style={styles.goldCoinInner}
                    >
                      <Text style={styles.goldCoinGlyph}>Z</Text>
                    </LinearGradient>
                  </LinearGradient>
                </View>

                {/* Balance Display Column */}
                <View style={styles.balanceValuesColumn}>
                  <View style={styles.tokenLabelEyeRow}>
                    <Text style={styles.totalXCoinLabel}>Total Network Earnings</Text>
                    <TouchableOpacity
                      onPress={() => setHideEarnings(!hideEarnings)}
                      style={styles.compactEyeBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Toggle Visibility"
                    >
                      <Ionicons
                        name={hideEarnings ? 'eye-off-outline' : 'eye-outline'}
                        size={14}
                        color="#94A3B8"
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.amountNumberRow}>
                    <Text style={styles.mainBalanceDigits} numberOfLines={1}>
                      {hideEarnings
                        ? '••••••••'
                        : teamOverview.totalCommissionsRaw > 0
                        ? teamOverview.totalCommissionsRaw.toFixed(2)
                        : '0.00'}
                    </Text>
                    <Text style={styles.mainBalanceCurrency} numberOfLines={1}>
                      {hideEarnings ? '' : ' xCoin'}
                    </Text>
                  </View>

                  <Text style={styles.mainFiatEquivalent} numberOfLines={1}>
                    {hideEarnings ? '••••••' : `≈ ${teamOverview.fiatCommissions} INR`}
                  </Text>
                </View>
              </View>

              {/* Right: Ready to Claim Emerald Card */}
              <TouchableOpacity
                style={styles.claimHighlightCard}
                onPress={() => {
                  if (hasClaimed) {
                    Alert.alert('All Claimed', 'No pending commissions at this moment.');
                  } else {
                    setShowClaimModal(true);
                  }
                }}
                activeOpacity={0.85}
              >
                <View style={styles.claimMetricRow}>
                  <Ionicons
                    name={hasClaimed ? 'checkmark-circle' : 'flash'}
                    size={12}
                    color="#10B981"
                  />
                  <Text style={styles.claimMetricValue}>
                    {hasClaimed ? 'Claimed' : `+ ${unclaimedAmount}`}
                  </Text>
                </View>
                <Text style={styles.claimMetricLabel}>
                  {hasClaimed ? 'Deposited' : 'Tap to Claim'}
                </Text>
              </TouchableOpacity>
            </View>


            {/* Breathable 2x2 Performance Matrix Grid */}
            <View style={styles.matrixGridContainer}>
              <View style={styles.matrixBox}>
                <View style={[styles.matrixIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.22)' }]}>
                  <Ionicons name="people" size={15} color="#A5B4FC" />
                </View>
                <View style={styles.matrixContent}>
                  <Text style={styles.matrixValue}>{teamOverview.l1Count} Active</Text>
                  <Text style={styles.matrixLabel}>L1 Direct (10%)</Text>
                </View>
              </View>

              <View style={styles.matrixBox}>
                <View style={[styles.matrixIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.22)' }]}>
                  <Ionicons name="git-network" size={15} color="#6EE7B7" />
                </View>
                <View style={styles.matrixContent}>
                  <Text style={styles.matrixValue}>{teamOverview.l2Count} Members</Text>
                  <Text style={styles.matrixLabel}>L2 Sub-team (5%)</Text>
                </View>
              </View>

              <View style={styles.matrixBox}>
                <View style={[styles.matrixIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.22)' }]}>
                  <Ionicons name="wallet" size={15} color="#FDE68A" />
                </View>
                <View style={styles.matrixContent}>
                  <Text style={styles.matrixValue}>{teamOverview.fiatCommissions}</Text>
                  <Text style={styles.matrixLabel}>30D Team Vol</Text>
                </View>
              </View>

              <View style={styles.matrixBox}>
                <View style={[styles.matrixIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.22)' }]}>
                  <Ionicons name="podium" size={15} color="#BAE6FD" />
                </View>
                <View style={styles.matrixContent}>
                  <Text style={styles.matrixValue}>#14 Rank</Text>
                  <Text style={styles.matrixLabel}>Global Leaderboard</Text>
                </View>
              </View>
            </View>

            {/* Luminous Organic Cosmic Waves along the bottom */}
            <View style={styles.waveContainer} pointerEvents="none">
              <LinearGradient
                colors={['rgba(99, 102, 241, 0.3)', 'rgba(139, 92, 246, 0.12)', 'transparent']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={styles.cosmicWaveOne}
              />
              <LinearGradient
                colors={['rgba(124, 58, 237, 0.35)', 'rgba(79, 70, 229, 0.08)', 'transparent']}
                start={{ x: 1, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={styles.cosmicWaveTwo}
              />
            </View>
          </LinearGradient>

          {/* VIP PROGRESS TRACKER CARD */}
          <View style={styles.vipProgressCard}>
            <View style={styles.vipProgressHeader}>
              <View style={styles.vipProgressHeaderLeft}>
                <View style={styles.vipIconCircle}>
                  <Ionicons name="shield-checkmark" size={15} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.vipProgressTitle}>Next Tier: Platinum Partner</Text>
                  <Text style={styles.vipProgressSub}>Tier 3 • 15% Lifetime Rebates</Text>
                </View>
              </View>
              <Text style={styles.vipProgressPercent}>139 / 150 (92%)</Text>
            </View>

            {/* Progress Bar Track */}
            <View style={styles.progressBarTrack}>
              <LinearGradient
                colors={['#4318FF', '#7551FF', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: '92%' }]}
              />
            </View>

            <View style={styles.vipPerksUnlockRow}>
              <Ionicons name="gift-outline" size={14} color="#10B981" />
              <Text style={styles.vipPerksUnlockText}>
                Invite <Text style={styles.boldHighlight}>11 more active traders</Text> to unlock 15% Direct Rebate & zero withdrawal fees!
              </Text>
            </View>
          </View>

          {/* REFERRAL HUB & SHARING SUITE */}
          <View style={styles.referralSuiteCard}>
            <View style={styles.suiteHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.suiteTitle}>Partner Referral Hub</Text>
                <Text style={styles.suiteSubtitle}>
                  Earn lifetime rebates on all your friends’ buy/sell trades
                </Text>
              </View>

              <TouchableOpacity
                style={styles.qrPassBtn}
                onPress={() => setShowQrModal(true)}
                activeOpacity={0.8}
                accessibilityLabel="View QR Pass"
              >
                <Ionicons name="qr-code-outline" size={16} color={Colors.primary} />
                <Text style={styles.qrPassBtnText}>QR Pass</Text>
              </TouchableOpacity>
            </View>

            {/* Segmented Mode Switcher: Code vs Link */}
            <View style={styles.modeSwitcherContainer}>
              <TouchableOpacity
                style={[
                  styles.modeSwitcherTab,
                  referralMode === 'Code' && styles.modeSwitcherTabActive,
                ]}
                onPress={() => setReferralMode('Code')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="key-outline"
                  size={14}
                  color={referralMode === 'Code' ? Colors.primary : '#8F9BBA'}
                />
                <Text
                  style={[
                    styles.modeSwitcherText,
                    referralMode === 'Code' && styles.modeSwitcherTextActive,
                  ]}
                >
                  Referral Code
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeSwitcherTab,
                  referralMode === 'Link' && styles.modeSwitcherTabActive,
                ]}
                onPress={() => setReferralMode('Link')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="link-outline"
                  size={14}
                  color={referralMode === 'Link' ? Colors.primary : '#8F9BBA'}
                />
                <Text
                  style={[
                    styles.modeSwitcherText,
                    referralMode === 'Link' && styles.modeSwitcherTextActive,
                  ]}
                >
                  Invite Link
                </Text>
              </TouchableOpacity>
            </View>

            {/* Code / Link Display Box */}
            {referralMode === 'Code' ? (
              <View style={styles.codeContainer}>
                <View style={styles.codeTextWrapper}>
                  <Text style={styles.codeMetaLabel}>YOUR EXCLUSIVE PARTNER CODE</Text>
                  <Text style={styles.codeDisplay}>{referralCode}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.actionCopyBtn, copiedCode && styles.actionCopyBtnDone]}
                  onPress={handleCopyCode}
                  activeOpacity={0.85}
                  accessibilityLabel="Copy Code"
                >
                  <Ionicons
                    name={copiedCode ? 'checkmark-circle' : 'copy-outline'}
                    size={15}
                    color="#FFFFFF"
                  />
                  <Text style={styles.actionCopyBtnText}>
                    {copiedCode ? 'Copied!' : 'Copy Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.codeContainer}>
                <View style={[styles.codeTextWrapper, { paddingRight: 8 }]}>
                  <Text style={styles.codeMetaLabel}>DIRECT ONBOARDING LINK</Text>
                  <Text style={styles.linkDisplay} numberOfLines={1}>
                    {referralLink}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.actionCopyBtn, copiedLink && styles.actionCopyBtnDone]}
                  onPress={handleCopyLink}
                  activeOpacity={0.85}
                  accessibilityLabel="Copy Link"
                >
                  <Ionicons
                    name={copiedLink ? 'checkmark-circle' : 'copy-outline'}
                    size={15}
                    color="#FFFFFF"
                  />
                  <Text style={styles.actionCopyBtnText}>
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Multi-Channel Social Share Grid (2x2 Clean Layout) */}
            <View style={styles.socialButtonsGrid}>
              <TouchableOpacity
                style={[styles.socialSharePill, { backgroundColor: '#25D366' }]}
                onPress={() => handleSocialShare('WhatsApp')}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                <Text style={styles.socialPillText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialSharePill, { backgroundColor: '#0088CC' }]}
                onPress={() => handleSocialShare('Telegram')}
                activeOpacity={0.85}
              >
                <Ionicons name="paper-plane" size={15} color="#FFFFFF" />
                <Text style={styles.socialPillText}>Telegram</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialSharePill, { backgroundColor: '#0F172A' }]}
                onPress={() => handleSocialShare('Twitter')}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-twitter" size={15} color="#FFFFFF" />
                <Text style={styles.socialPillText}>X (Twitter)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialSharePill, { backgroundColor: Colors.primary }]}
                onPress={handleNativeShare}
                activeOpacity={0.85}
              >
                <Ionicons name="share-social" size={15} color="#FFFFFF" />
                <Text style={styles.socialPillText}>More Options</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* INTERACTIVE EARNINGS SIMULATOR */}
          <View style={styles.calcCard}>
            <View style={styles.calcHeader}>
              <View style={styles.calcHeaderLeft}>
                <View style={styles.calcIconBox}>
                  <Ionicons name="calculator-outline" size={16} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.calcTitle}>Projected Monthly Commission</Text>
                  <Text style={styles.calcSub}>Estimate potential passive payouts</Text>
                </View>
              </View>
              <View style={styles.calcBadge}>
                <Text style={styles.calcBadgeText}>Interactive</Text>
              </View>
            </View>

            <View style={styles.calcPillsRow}>
              {calcTiers.map((tier, idx) => {
                const isSelected = selectedCalcTier === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.calcPill, isSelected && styles.calcPillActive]}
                    onPress={() => setSelectedCalcTier(idx)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.calcPillLabel,
                        isSelected && styles.calcPillLabelActive,
                      ]}
                    >
                      {tier.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calcResultBox}>
              <View>
                <Text style={styles.calcResultLabel}>Est. Monthly Payout</Text>
                <Text style={styles.calcResultValue}>
                  {calcTiers[selectedCalcTier].rebate}
                </Text>
              </View>
              <View style={styles.calcTokenBadge}>
                <Ionicons name="wallet-outline" size={14} color="#10B981" />
                <Text style={styles.calcTokenText}>
                  ≈ {calcTiers[selectedCalcTier].xCoin}
                </Text>
              </View>
            </View>
          </View>

          {/* ACTIVE TEAM DIRECTORY & FILTERS */}
          <View style={styles.directorySection}>
            <View style={styles.directoryHeader}>
              <View>
                <Text style={styles.directoryTitle}>Active Team Members</Text>
                <Text style={styles.directorySubtitle}>
                  Showing {filteredMembers.length} network contributors
                </Text>
              </View>

              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>139 Total</Text>
              </View>
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchBarContainer}>
              <Ionicons name="search-outline" size={16} color="#8F9BBA" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search member name or ID..."
                placeholderTextColor="#A3AED0"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={17} color="#8F9BBA" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabFiltersRow}>
              {(
                [
                  { key: 'All', label: 'All (139)' },
                  { key: 'L1', label: 'Direct L1 (25)' },
                  { key: 'L2', label: 'Network L2 (114)' },
                  { key: 'Top', label: 'Top Earners' },
                ] as const
              ).map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.tabFilterPill, isActive && styles.tabFilterPillActive]}
                    onPress={() => setActiveTab(tab.key)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.tabFilterText,
                        isActive && styles.tabFilterTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Members List */}
            <View style={styles.membersList}>
              {filteredMembers.length === 0 ? (
                <View style={styles.emptyStateBox}>
                  <Ionicons name="people-outline" size={38} color="#8F9BBA" />
                  <Text style={styles.emptyStateTitle}>No members found</Text>
                  <Text style={styles.emptyStateDesc}>
                    Try searching with another keyword or invite new friends.
                  </Text>
                </View>
              ) : (
                filteredMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.memberCard}
                    onPress={() => handleMemberAction(member)}
                    activeOpacity={0.88}
                  >
                    <View style={styles.memberCardLeft}>
                      {/* Avatar with Status Ring */}
                      <View style={styles.avatarContainer}>
                        <View
                          style={[
                            styles.memberAvatar,
                            { backgroundColor: member.avatarBg },
                          ]}
                        >
                          <Text style={styles.avatarInitials}>
                            {member.avatarText}
                          </Text>
                        </View>
                        {member.isOnline && <View style={styles.memberOnlineDot} />}
                      </View>

                      {/* Name & Metadata */}
                      <View style={styles.memberInfoCol}>
                        <View style={styles.memberNameRow}>
                          <Text style={styles.memberName} numberOfLines={1}>
                            {member.name}
                          </Text>
                          <View
                            style={[
                              styles.levelBadge,
                              member.level === 'Level 1'
                                ? styles.levelBadgeL1
                                : styles.levelBadgeL2,
                            ]}
                          >
                            <Text
                              style={[
                                styles.levelBadgeText,
                                member.level === 'Level 1'
                                  ? styles.levelBadgeTextL1
                                  : styles.levelBadgeTextL2,
                              ]}
                            >
                              {member.levelLabel}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.memberMetaRow}>
                          <Text style={styles.memberCodeText}>{member.code}</Text>
                          <Text style={styles.dotSeparator}>•</Text>
                          <Text style={styles.memberJoinedText}>
                            {member.joined}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Right side stats */}
                    <View style={styles.memberCardRight}>
                      <Text style={styles.commissionEarned}>
                        {member.commission}
                      </Text>
                      <View style={styles.statusPill}>
                        <Text
                          style={[
                            styles.statusPillLabel,
                            member.status === 'Top Trader' && {
                              color: '#F59E0B',
                            },
                            member.status === 'Trading Now' && {
                              color: '#10B981',
                            },
                          ]}
                        >
                          {member.status}
                        </Text>
                      </View>
                      <Text style={styles.volumeMiniText}>
                        Vol: {member.tradeVolume}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* RULES & VIP TIERS MODAL */}
        <Modal
          visible={showRulesModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRulesModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowRulesModal(false)}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation?.()}>
                <View style={styles.modalContentCard}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderLeft}>
                      <View style={[styles.modalHeaderIconBox, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="trophy" size={20} color="#D97706" />
                      </View>
                      <View>
                        <Text style={styles.modalTitle}>VIP Partner Program</Text>
                        <Text style={styles.modalSubtitle}>Tier architecture & guidelines</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowRulesModal(false)}
                      style={styles.modalCloseBtn}
                    >
                      <Ionicons name="close" size={18} color="#707EAE" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.modalScroll}
                  >
                    <Text style={styles.modalDesc}>
                      Zapp Pay offers an institutional-grade, multi-tier commission architecture.
                      Earn passive revenue in real-time on every spot, futures, and swap transaction executed by your network.
                    </Text>

                    {/* Tier breakdown cards */}
                    <View style={styles.tierBreakdownBox}>
                      <View style={styles.tierRowItem}>
                        <View style={styles.tierDotGreen} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tierRowHeading}>
                            Level 1 Direct Referrals (10% Rebate)
                          </Text>
                          <Text style={styles.tierRowSub}>
                            Earn 10% of all trading fee revenues generated directly by users registering with your code.
                          </Text>
                        </View>
                      </View>

                      <View style={styles.tierRowItem}>
                        <View style={styles.tierDotBlue} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tierRowHeading}>
                            Level 2 Secondary Network (5% Rebate)
                          </Text>
                          <Text style={styles.tierRowSub}>
                            Earn 5% trading fee commission whenever your direct referrals bring in their own sub-network.
                          </Text>
                        </View>
                      </View>

                      <View style={styles.tierRowItem}>
                        <View style={styles.tierDotPurple} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tierRowHeading}>
                            Global Weekly Prize Pool (Top 10)
                          </Text>
                          <Text style={styles.tierRowSub}>
                            Top 10 weekly affiliate leaders share a ₹ 2,50,000 cash pool automatically distributed every Monday at 00:00 UTC.
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Benefits List */}
                    <View style={styles.bulletRulesList}>
                      <View style={styles.bulletItem}>
                        <Ionicons name="checkmark-done-circle" size={16} color="#10B981" />
                        <Text style={styles.bulletText}>
                          Instant real-time settlement into your xCoin wallet.
                        </Text>
                      </View>
                      <View style={styles.bulletItem}>
                        <Ionicons name="checkmark-done-circle" size={16} color="#10B981" />
                        <Text style={styles.bulletText}>
                          Lifetime attribution: Your referrals never expire.
                        </Text>
                      </View>
                      <View style={styles.bulletItem}>
                        <Ionicons name="checkmark-done-circle" size={16} color="#10B981" />
                        <Text style={styles.bulletText}>
                          Zero gas fees on claiming commission rewards.
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.modalActionPrimary}
                      onPress={() => setShowRulesModal(false)}
                    >
                      <Text style={styles.modalActionPrimaryText}>Understood</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* PARTNER QR PASS MODAL */}
        <Modal
          visible={showQrModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQrModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowQrModal(false)}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation?.()}>
                <View style={styles.qrModalCard}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderLeft}>
                      <View style={[styles.modalHeaderIconBox, { backgroundColor: '#EEF2FF' }]}>
                        <Ionicons name="qr-code" size={20} color={Colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.modalTitle}>VIP Partner Pass</Text>
                        <Text style={styles.modalSubtitle}>Scan to join under your network</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowQrModal(false)}
                      style={styles.modalCloseBtn}
                    >
                      <Ionicons name="close" size={18} color="#707EAE" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.qrModalSubtitle}>
                    Show this QR pass to friends or at crypto meetups. Scanners automatically apply your partner referral discount!
                  </Text>

                  {/* High-tech Web3 QR Graphic Box */}
                  <View style={styles.qrGraphicContainer}>
                    <View style={styles.qrFrameCornerTopLeft} />
                    <View style={styles.qrFrameCornerTopRight} />
                    <View style={styles.qrFrameCornerBottomLeft} />
                    <View style={styles.qrFrameCornerBottomRight} />

                    {/* Simulated Web3 QR Pattern Matrix */}
                    <View style={styles.qrMatrixPattern}>
                      <View style={styles.qrMatrixRow}>
                        <View style={styles.qrMatrixCornerBox}>
                          <View style={styles.qrMatrixCornerInner} />
                        </View>
                        <View style={styles.qrPatternGridMini} />
                        <View style={styles.qrMatrixCornerBox}>
                          <View style={styles.qrMatrixCornerInner} />
                        </View>
                      </View>

                      {/* Zapp Pay Brand Centerpiece */}
                      <View style={styles.qrCenterLogoBadge}>
                        <Image
                          source={require('../../../assets/images/logo_transparent.png')}
                          style={styles.qrCenterLogoImg}
                          resizeMode="contain"
                        />
                      </View>

                      <View style={styles.qrMatrixRow}>
                        <View style={styles.qrMatrixCornerBox}>
                          <View style={styles.qrMatrixCornerInner} />
                        </View>
                        <View style={styles.qrPatternGridMini} />
                        <View style={styles.qrPixelBlock} />
                      </View>
                    </View>
                  </View>

                  <View style={styles.qrCodeBadgeBox}>
                    <Text style={styles.qrCodeBadgeLabel}>VIP PARTNER CODE</Text>
                    <Text style={styles.qrCodeBadgeText}>{referralCode}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.modalActionPrimary}
                    onPress={() => {
                      handleCopyLink();
                      setShowQrModal(false);
                    }}
                  >
                    <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.modalActionPrimaryText}>Copy Referral Link</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* CLAIM REWARDS MODAL */}
        <Modal
          visible={showClaimModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowClaimModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowClaimModal(false)}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation?.()}>
                <View style={styles.claimModalCard}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderLeft}>
                      <View style={[styles.modalHeaderIconBox, { backgroundColor: '#E6FAF5' }]}>
                        <Ionicons name="sparkles" size={20} color="#05CD99" />
                      </View>
                      <View>
                        <Text style={styles.modalTitle}>Claim Commission</Text>
                        <Text style={styles.modalSubtitle}>Instant zero-gas deposit</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowClaimModal(false)}
                      style={styles.modalCloseBtn}
                    >
                      <Ionicons name="close" size={18} color="#707EAE" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.claimCenterBox}>
                    <View style={styles.claimCoinIconCircle}>
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.claimCoinGradient}
                      >
                        <Ionicons name="wallet" size={30} color="#FFFFFF" />
                      </LinearGradient>
                    </View>

                    <Text style={styles.claimModalAmount}>
                      {unclaimedAmount} xCoin
                    </Text>
                    <Text style={styles.claimModalFiat}>≈ ₹ 46,436.00 INR</Text>
                    <Text style={styles.claimModalNote}>
                      Ready for instant settlement into your Zapp Pay Web3 Wallet.
                    </Text>
                  </View>

                  <View style={styles.claimFeeSummary}>
                    <View style={styles.claimFeeRow}>
                      <Text style={styles.claimFeeLabel}>Destination</Text>
                      <Text style={styles.claimFeeValue}>Primary xCoin Balance</Text>
                    </View>
                    <View style={styles.claimFeeRow}>
                      <Text style={styles.claimFeeLabel}>Network Gas Fee</Text>
                      <Text style={[styles.claimFeeValue, { color: '#10B981', fontWeight: '800' }]}>
                        FREE (Sponsored by Zapp Pay)
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.modalClaimAction}
                    onPress={handleConfirmClaim}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.modalClaimGradient}
                    >
                      <Text style={styles.modalClaimActionText}>
                        Confirm & Deposit Now
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* MEMBER DETAILS / BOOST MODAL */}
        <Modal
          visible={selectedMember !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedMember(null)}
        >
          <TouchableWithoutFeedback onPress={() => setSelectedMember(null)}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation?.()}>
                <View style={styles.memberActionCard}>
                  {selectedMember && (
                    <>
                      <View style={styles.modalHeader}>
                        <View style={styles.modalHeaderLeft}>
                          <View
                            style={[
                              styles.memberActionAvatar,
                              { backgroundColor: selectedMember.avatarBg },
                            ]}
                          >
                            <Text style={styles.memberActionAvatarText}>
                              {selectedMember.avatarText}
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.modalTitle}>{selectedMember.name}</Text>
                            <Text style={styles.modalSubtitle}>
                              {selectedMember.code} • {selectedMember.levelLabel}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => setSelectedMember(null)}
                          style={styles.modalCloseBtn}
                        >
                          <Ionicons name="close" size={18} color="#707EAE" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.memberStatsRow}>
                        <View style={styles.memberStatBox}>
                          <Text style={styles.memberStatLabel}>Total Generated</Text>
                          <Text style={[styles.memberStatVal, { color: '#10B981' }]}>
                            {selectedMember.commission}
                          </Text>
                        </View>
                        <View style={styles.memberStatBox}>
                          <Text style={styles.memberStatLabel}>30D Volume</Text>
                          <Text style={styles.memberStatVal}>
                            {selectedMember.tradeVolume}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.memberActionButtonsCol}>
                        <TouchableOpacity
                          style={[styles.modalActionPrimary, { backgroundColor: '#10B981' }]}
                          onPress={() => {
                            const name = selectedMember.name;
                            setSelectedMember(null);
                            Alert.alert(
                              '⚡ Boost Sent!',
                              `Trading fee rebate alert & market signals pushed to ${name}!`
                            );
                          }}
                        >
                          <Ionicons name="flash" size={16} color="#FFFFFF" />
                          <Text style={styles.modalActionPrimaryText}>
                            Send Trading Boost ⚡
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.modalSecondaryBtn}
                          onPress={() => {
                            const name = selectedMember.name;
                            setSelectedMember(null);
                            handleSocialShare('WhatsApp');
                          }}
                        >
                          <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                          <Text style={styles.modalSecondaryBtnText}>
                            Message via WhatsApp
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
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
    backgroundColor: 'rgba(244, 247, 254, 0.94)',
  },

  /* Top App Bar - Mobile Safe Area & Luxury Styling */
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
  headerLeftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  backBtn: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
    marginRight: 8,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  userProfileTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarGradientRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4318FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#05CD99',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userMetaContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingPrefix: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4318FF',
    letterSpacing: 0.2,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    marginTop: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B2559',
    letterSpacing: -0.2,
  },
  verifiedCheckBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E6FAF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  kycRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  vipMiniBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: '#FDE68A',
  },
  vipMiniText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#D97706',
  },
  kycBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#707EAE',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionIconBtn: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  perksIconBtn: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  headerBrandBadge: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerLogoImage: {
    width: 22,
    height: 22,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 40,
  },

  /* MASTER HERO CARD - Cosmic Theme matching Home Screen */
  heroCard: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 22,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  cosmicCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cosmicHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
    marginRight: 6,
  },
  walletHeaderIcon: {
    marginRight: 1,
  },
  headerTextGroup: {
    flex: 1,
  },
  cosmicHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  cosmicHeaderSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  web3NetworkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  web3NetworkBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  web3LiveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },

  /* Main Figures Row: 3D Gold Coin + Amounts + Claim Card */
  balanceMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 16,
    zIndex: 2,
  },
  balanceLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  goldCoinOuter: {
    marginRight: 9,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  goldCoinRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldCoinInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  goldCoinGlyph: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    lineHeight: 24,
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  balanceValuesColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  tokenLabelEyeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  totalXCoinLabel: {
    fontSize: 11.5,
    color: '#8E9BB5',
    fontWeight: '500',
  },
  compactEyeBtn: {
    padding: 2,
  },
  amountNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  mainBalanceDigits: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  mainBalanceCurrency: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  mainFiatEquivalent: {
    fontSize: 12.5,
    color: '#8E9BB5',
    fontWeight: '500',
    marginTop: 1.5,
  },
  claimHighlightCard: {
    backgroundColor: 'rgba(6, 78, 59, 0.55)',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    minWidth: 76,
  },
  claimMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  claimMetricValue: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  claimMetricLabel: {
    color: '#6EE7B7',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: 0.1,
    textAlign: 'center',
  },

  /* 2x2 Performance Matrix Grid */
  matrixGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    zIndex: 2,
  },
  matrixBox: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 13,
    padding: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  matrixIconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matrixContent: {
    flex: 1,
  },
  matrixValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  matrixLabel: {
    fontSize: 9.5,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 1,
  },

  /* Wave Artwork */
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    overflow: 'hidden',
  },
  cosmicWaveOne: {
    position: 'absolute',
    bottom: -16,
    left: -20,
    right: 30,
    height: 44,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 140,
    transform: [{ rotate: '-3deg' }],
  },
  cosmicWaveTwo: {
    position: 'absolute',
    bottom: -18,
    left: 50,
    right: -25,
    height: 40,
    borderTopLeftRadius: 140,
    borderTopRightRadius: 100,
    transform: [{ rotate: '4deg' }],
  },

  /* VIP PROGRESS CARD */
  vipProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  vipProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },
  vipProgressHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  vipIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipProgressTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
  },
  vipProgressSub: {
    fontSize: 10.5,
    color: '#707EAE',
    fontWeight: '600',
  },
  vipProgressPercent: {
    fontSize: 11.5,
    fontWeight: '800',
    color: Colors.primary,
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EEF2F6',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  vipPerksUnlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vipPerksUnlockText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    flex: 1,
  },
  boldHighlight: {
    fontWeight: '800',
    color: '#1B2559',
  },

  /* REFERRAL SUITE */
  referralSuiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  suiteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  suiteTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B2559',
  },
  suiteSubtitle: {
    fontSize: 11,
    color: '#707EAE',
    marginTop: 1,
  },
  qrPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    borderRadius: 9,
    gap: 4,
  },
  qrPassBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  modeSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#F4F7FE',
    borderRadius: 11,
    padding: 3.5,
    marginBottom: 12,
  },
  modeSwitcherTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  modeSwitcherTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  modeSwitcherText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#8F9BBA',
  },
  modeSwitcherTextActive: {
    fontWeight: '800',
    color: Colors.primary,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 13,
    padding: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C7D2FE',
    marginBottom: 12,
  },
  codeTextWrapper: {
    flex: 1,
  },
  codeMetaLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#8F9BBA',
    letterSpacing: 0.5,
  },
  codeDisplay: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1.5,
    marginTop: 1,
  },
  linkDisplay: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 1,
  },
  actionCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    gap: 4.5,
  },
  actionCopyBtnDone: {
    backgroundColor: '#10B981',
  },
  actionCopyBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  socialButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  socialSharePill: {
    width: '48.8%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
    gap: 5,
  },
  socialPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  /* CALCULATOR */
  calcCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  calcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calcHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  calcIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
  },
  calcSub: {
    fontSize: 10.5,
    color: '#707EAE',
    fontWeight: '600',
  },
  calcBadge: {
    backgroundColor: '#E6FAF5',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  calcBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#10B981',
  },
  calcPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  calcPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
    backgroundColor: '#F4F7FE',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calcPillActive: {
    backgroundColor: '#EEF2FF',
    borderColor: Colors.primary,
  },
  calcPillLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  calcPillLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  calcResultBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  calcResultLabel: {
    fontSize: 9.5,
    color: '#707EAE',
    fontWeight: '600',
  },
  calcResultValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B2559',
    marginTop: 1.5,
  },
  calcTokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FAF5',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    gap: 4,
  },
  calcTokenText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#10B981',
  },

  /* DIRECTORY & FILTERS */
  directorySection: {
    marginBottom: 10,
  },
  directoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  directoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B2559',
  },
  directorySubtitle: {
    fontSize: 10.5,
    color: '#707EAE',
    marginTop: 1,
  },
  totalBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  totalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#1B2559',
    fontWeight: '600',
  },
  tabFiltersRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 12,
  },
  tabFilterPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabFilterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabFilterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  tabFilterTextActive: {
    color: '#FFFFFF',
  },
  membersList: {
    gap: 8,
  },
  emptyStateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyStateTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1B2559',
    marginTop: 6,
  },
  emptyStateDesc: {
    fontSize: 11,
    color: '#707EAE',
    textAlign: 'center',
    marginTop: 3,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  memberCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 6,
  },
  avatarContainer: {
    position: 'relative',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  memberOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  memberInfoCol: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
    maxWidth: 115,
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  levelBadgeL1: {
    backgroundColor: '#EEF2FF',
  },
  levelBadgeL2: {
    backgroundColor: '#F0FDF4',
  },
  levelBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  levelBadgeTextL1: {
    color: Colors.primary,
  },
  levelBadgeTextL2: {
    color: '#10B981',
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  memberCodeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#707EAE',
  },
  dotSeparator: {
    fontSize: 9,
    color: '#CBD5E1',
  },
  memberJoinedText: {
    fontSize: 10.5,
    color: '#A3AED0',
  },
  memberCardRight: {
    alignItems: 'flex-end',
    gap: 1.5,
  },
  commissionEarned: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#10B981',
  },
  statusPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 5.5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  statusPillLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },
  volumeMiniText: {
    fontSize: 9.5,
    color: '#707EAE',
    fontWeight: '500',
  },

  /* MODALS */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    width: '100%',
    maxWidth: 360,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  modalHeaderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#707EAE',
    fontWeight: '500',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F7FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    maxHeight: 440,
  },
  modalDesc: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16.5,
    marginBottom: 14,
  },
  tierBreakdownBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tierRowItem: {
    flexDirection: 'row',
    gap: 8,
  },
  tierDotGreen: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginTop: 4,
  },
  tierDotBlue: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
  tierDotPurple: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#8B5CF6',
    marginTop: 4,
  },
  tierRowHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  tierRowSub: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 14.5,
    marginTop: 1.5,
  },
  bulletRulesList: {
    gap: 7,
    marginBottom: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  bulletText: {
    fontSize: 11.5,
    color: '#1B2559',
    fontWeight: '600',
    flex: 1,
  },
  modalActionPrimary: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  modalActionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },

  /* QR MODAL */
  qrModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  qrModalSubtitle: {
    fontSize: 11.5,
    color: '#707EAE',
    textAlign: 'center',
    lineHeight: 15.5,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  qrGraphicContainer: {
    width: 180,
    height: 180,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  qrFrameCornerTopLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: Colors.primary,
    borderRadius: 4,
  },
  qrFrameCornerTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: Colors.primary,
    borderRadius: 4,
  },
  qrFrameCornerBottomLeft: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 20,
    height: 20,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: Colors.primary,
    borderRadius: 4,
  },
  qrFrameCornerBottomRight: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: Colors.primary,
    borderRadius: 4,
  },
  qrMatrixPattern: {
    width: 126,
    height: 126,
    justifyContent: 'space-between',
    position: 'relative',
  },
  qrMatrixRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrMatrixCornerBox: {
    width: 32,
    height: 32,
    borderWidth: 2.5,
    borderColor: '#1B2559',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrMatrixCornerInner: {
    width: 16,
    height: 16,
    backgroundColor: '#1B2559',
    borderRadius: 3,
  },
  qrPatternGridMini: {
    width: 22,
    height: 7,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  qrPixelBlock: {
    width: 32,
    height: 32,
    backgroundColor: '#F4F7FE',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#818CF8',
    borderRadius: 5,
  },
  qrCenterLogoBadge: {
    position: 'absolute',
    top: 42,
    left: 42,
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCenterLogoImg: {
    width: 32,
    height: 32,
  },
  qrCodeBadgeBox: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 14,
  },
  qrCodeBadgeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.8,
  },
  qrCodeBadgeText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 2,
    marginTop: 1,
  },

  /* CLAIM MODAL */
  claimModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  claimCenterBox: {
    alignItems: 'center',
    marginVertical: 12,
  },
  claimCoinIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    marginBottom: 10,
  },
  claimCoinGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimModalAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1B2559',
  },
  claimModalFiat: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 2,
  },
  claimModalNote: {
    fontSize: 11,
    color: '#707EAE',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 10,
  },
  claimFeeSummary: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 11,
    gap: 7,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  claimFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  claimFeeLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  claimFeeValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1B2559',
  },
  modalClaimAction: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalClaimGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClaimActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* MEMBER ACTION CARD */
  memberActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  memberActionAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberActionAvatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  memberStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 14,
  },
  memberStatBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 11,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberStatLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#707EAE',
    marginBottom: 2,
  },
  memberStatVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
  },
  memberActionButtonsCol: {
    width: '100%',
    gap: 8,
  },
  modalSecondaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  modalSecondaryBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#15803D',
  },
});
