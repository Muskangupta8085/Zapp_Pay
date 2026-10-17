import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
  ImageBackground,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { HomeService } from '../../services/api.service';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onNavigateToProfile?: () => void;
  onNavigateToOrders?: () => void;
  onNavigateToTeam?: () => void;
  onNavigateToRewards?: () => void;
  onNavigateToBuy?: () => void;
  onNavigateToSell?: () => void;
  onNavigateToUpi?: () => void;
  onNavigateToRequest?: () => void;
  onNavigateToWallet?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToProfile,
  onNavigateToOrders,
  onNavigateToTeam,
  onNavigateToRewards,
  onNavigateToBuy,
  onNavigateToSell,
  onNavigateToUpi,
  onNavigateToRequest,
  onNavigateToWallet,
}) => {
  const insets = useSafeAreaInsets();
  const { user, xCoinBalance, usdtBalance, refreshWallet } = useAuth();
  const displayName = user?.fullName || 'Trader';

  useEffect(() => {
    refreshWallet();
  }, []);

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

  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '1Y' | 'ALL'>('1D');
  const [selectedTab, setSelectedTab] = useState<'Hot' | 'Gainers' | 'New'>('Hot');
  const [hideBalance, setHideBalance] = useState(false);
  const [activeActionModal, setActiveActionModal] = useState<'Buy' | 'Sell' | 'UPI' | 'Request' | 'Wallet' | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [buyAmount, setBuyAmount] = useState('1500');
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Time-aware dynamic mobile greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
 
  // Dynamic network protocol metrics
  const [networkStats, setNetworkStats] = useState({
    blockHeight: '#1,849,204',
    avgBlockTime: '1.2s',
    tps: '4,820',
    gasFee: '₹0.00 FREE',
  });

  // Real-time mobile wallet & crypto notifications
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Welcome Bonus Activated',
      message: '100.00 xCoin welcome bounty credited to your decentralized wallet.',
      time: 'Just now',
      type: 'deposit',
      unread: true,
    },
    {
      id: '2',
      title: 'xCoin New ATH Alert',
      message: 'Zapp Pay (xCoin) surged +14.28% to ₹108.37 with ₹14.8 Cr 24h volume!',
      time: '42m ago',
      type: 'surge',
      unread: true,
    },
  ]);

  // Dynamic market tokens from backend pricing service
  const [marketTokens, setMarketTokens] = useState([
    {
      id: 'xcoin',
      symbol: 'xCoin',
      name: 'Zapp Pay Native',
      price: '₹ 108.37',
      rawPrice: 108.37,
      change: '+14.28%',
      isPositive: true,
      volume: '₹ 14.8 Cr',
      isZappPay: true,
      tag: 'Native',
    },
    {
      id: 'usdt',
      symbol: 'USDT',
      name: 'Tether USD',
      price: '₹ 87.42',
      rawPrice: 87.42,
      change: '+0.05%',
      isPositive: true,
      volume: '₹ 95 Cr',
      glyph: '₮',
      badgeColor: '#10B981',
    },
    {
      id: 'xrp',
      symbol: 'XRP',
      name: 'Ripple',
      price: '₹ 54.10',
      rawPrice: 54.10,
      change: '+2.18%',
      isPositive: true,
      volume: '₹ 32 Cr',
      glyph: 'XRP',
      badgeColor: '#0F172A',
      isTextBadge: true,
    },
  ]);

  // Load real-time dashboard and notifications from API
  useEffect(() => {
    let isMounted = true;
    const fetchHomeDashboard = async () => {
      try {
        const data = await HomeService.getDashboard();
        if (isMounted && data) {
          if (Array.isArray(data.tickers) && data.tickers.length > 0) {
            setMarketTokens(data.tickers);
          }
          if (data.networkStatus) {
            setNetworkStats({
              blockHeight: data.networkStatus.blockHeight || '#1,849,204',
              avgBlockTime: data.networkStatus.nodeLatency || '1.2s',
              tps: data.networkStatus.tps || '4,820',
              gasFee: data.networkStatus.gasFee || '₹0.00 FREE',
            });
          }
        }
      } catch (err) {
        // Retain initial defaults on network glitch
      }
    };

    const fetchNotifications = async () => {
      try {
        if (user) {
          const list = await HomeService.getNotifications();
          if (isMounted && Array.isArray(list) && list.length > 0) {
            setNotifications(
              list.map((n: any) => ({
                id: n._id || n.id,
                title: n.title,
                message: n.message,
                time: n.createdAt
                  ? new Date(n.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recent',
                type: n.type || 'deposit',
                unread: !n.isRead,
              }))
            );
          }
        }
      } catch (err) {
        // Keep fallback
      }
    };

    fetchHomeDashboard();
    fetchNotifications();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleMarkAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await HomeService.markAllNotificationsRead();
    } catch {
      // Ignored
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    try {
      await HomeService.markNotificationRead(id);
    } catch {
      // Ignored
    }
  };

  const filteredTokens = selectedTab === 'Gainers'
    ? marketTokens.filter((t) => t.isPositive)
    : selectedTab === 'New'
    ? marketTokens.filter((t) => t.isZappPay)
    : marketTokens;

  const xCoinRate = marketTokens.find((t) => t.id === 'xcoin')?.rawPrice || 108.37;
  const xCoinFormattedPrice = marketTokens.find((t) => t.id === 'xcoin')?.price || `₹ ${xCoinRate.toFixed(2)}`;

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
          {/* User Profile Gateway - Interactive Touch Target */}
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
                  {getTimeGreeting()} 👋
                </Text>
              </View>

              <View style={styles.userNameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {displayName}
                </Text>
                <View style={styles.verifiedCheckBadge}>
                  <Ionicons name="checkmark" size={9} color="#05CD99" />
                </View>
              </View>

              {/* VIP & KYC Status Capsule */}
              <View style={styles.kycRow}>
                <View style={styles.vipMiniBadge}>
                  <Text style={styles.vipMiniText}>{user?.role === 'admin' ? 'ADMIN' : 'VIP 1'}</Text>
                </View>
                <Text style={styles.kycBadgeText} numberOfLines={1}>
                  {user?.kycStatus === 'verified'
                    ? 'Verified • Tier 2'
                    : user?.kycStatus === 'pending'
                    ? 'KYC Pending'
                    : 'Active Member'}
                </Text>
                <Ionicons name="chevron-forward" size={11} color="#707EAE" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Right Mobile Actions Hub */}
          <View style={styles.headerRightActions}>
            {/* Quick QR Scanner / Pay Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.actionIconBtn}
              onPress={() => setShowQrModal(true)}
              accessibilityLabel="Scan QR"
            >
              <Ionicons name="qr-code-outline" size={18} color="#1B2559" />
            </TouchableOpacity>

            {/* Interactive Notification Bell */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.actionIconBtn}
              onPress={() => setShowNotificationsModal(true)}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={18} color="#1B2559" />
              {notifications.some((n) => n.unread) && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeCount}>
                    {notifications.filter((n) => n.unread).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>


          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Premium Main Center Section — Balance Card & Quick Actions (Matches Reference Image) */}
          <View style={styles.premiumBalanceWrapper}>
            {/* Top Half: Deep Cosmic Midnight Gradient Hero Card */}
            <LinearGradient
              colors={['#0F1538', '#161B4F', '#1F2578', '#2F2188']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cosmicBalanceCard}
            >
              {/* Header Row: Total Balance + Web3 Network Badge */}
              <View style={styles.cosmicCardHeader}>
                <View style={styles.cosmicHeaderLeft}>
                  <Ionicons name="wallet-outline" size={26} color="#FFFFFF" style={styles.walletHeaderIcon} />
                  <View style={styles.headerTextGroup}>
                    <Text style={styles.cosmicHeaderTitle}>Total Balance</Text>
                    <Text style={styles.cosmicHeaderSubtitle}>
                      Main Wallet / Portfolio Overview
                    </Text>
                  </View>
                </View>

                {/* Zapp Pay Web3 Badge */}
                <View style={styles.web3NetworkBadge}>
                  <Ionicons name="globe-outline" size={14} color="#C7D2FE" />
                  <Text style={styles.web3NetworkBadgeText}>Zapp Pay Web3</Text>
                  <View style={styles.web3LiveGreenDot} />
                </View>
              </View>

              {/* Main Balance Figures Row: 3D Gold Coin + Amounts + Profit Badge */}
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
                      <Text style={styles.totalXCoinLabel}>Total xCoin Balance</Text>
                      <TouchableOpacity
                        onPress={() => setHideBalance(!hideBalance)}
                        style={styles.compactEyeBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Toggle Balance Visibility"
                      >
                        <Ionicons
                          name={hideBalance ? 'eye-off-outline' : 'eye-outline'}
                          size={14}
                          color="#94A3B8"
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.amountNumberRow}>
                      <Text style={styles.mainBalanceDigits} numberOfLines={1}>
                        {hideBalance ? '••••••••' : xCoinBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                      <Text style={styles.mainBalanceCurrency} numberOfLines={1}>
                        {hideBalance ? '' : ' xCoin'}
                      </Text>
                    </View>

                    <Text style={styles.mainFiatEquivalent} numberOfLines={1}>
                      {hideBalance ? '••••••' : `₹ ${(xCoinBalance * xCoinRate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </Text>
                  </View>
                </View>

                {/* Right Profit/Loss Card */}
                <View style={styles.profitHighlightCard}>
                  <View style={styles.profitMetricRow}>
                    <Ionicons name="trending-up" size={13} color="#10B981" />
                    <Text style={styles.profitMetricValue}>+3.24%</Text>
                  </View>
                  <Text style={styles.profitMetricLabel}>Today's Profit/Loss</Text>
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

            {/* Bottom Half: Clean White Quick Actions Hub */}
            <View style={styles.quickActionsContainer}>
              <View style={styles.quickActionsHeaderRow}>
                <Ionicons name="flash" size={17} color="#6366F1" />
                <Text style={styles.quickActionsHeading}>Quick Actions</Text>
              </View>

              {/* 4 Pastel Action Cards: Buy, Sell, UPI, Wallet */}
              <View style={styles.actionPillsGrid}>
                {/* 1. BUY */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionPillCard, styles.actionPillBuy]}
                  onPress={() => (onNavigateToBuy ? onNavigateToBuy() : setActiveActionModal('Buy'))}
                >
                  <View style={[styles.actionIconCircle, styles.actionCircleBuy]}>
                    <Ionicons name="trending-up" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.actionCardTitle, { color: '#065F46' }]}>Buy</Text>
                  <Ionicons name="arrow-forward" size={12} color="#10B981" style={styles.actionArrow} />
                </TouchableOpacity>

                {/* 2. SELL */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionPillCard, styles.actionPillSell]}
                  onPress={() => (onNavigateToSell ? onNavigateToSell() : setActiveActionModal('Sell'))}
                >
                  <View style={[styles.actionIconCircle, styles.actionCircleSell]}>
                    <Ionicons name="trending-down" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.actionCardTitle, { color: '#881337' }]}>Sell</Text>
                  <Ionicons name="arrow-forward" size={12} color="#F43F5E" style={styles.actionArrow} />
                </TouchableOpacity>

                {/* 3. UPI */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionPillCard, styles.actionPillUpi]}
                  onPress={() => (onNavigateToUpi ? onNavigateToUpi() : setActiveActionModal('UPI'))}
                >
                  <View style={[styles.actionIconCircle, styles.actionCircleUpi]}>
                    <Ionicons name="send" size={14} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.actionCardTitle, { color: '#1E40AF' }]}>UPI</Text>
                  <Ionicons name="arrow-forward" size={12} color="#3B82F6" style={styles.actionArrow} />
                </TouchableOpacity>

                {/* 4. REQUEST */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionPillCard, styles.actionPillRequest]}
                  onPress={() => (onNavigateToRequest ? onNavigateToRequest() : setActiveActionModal('Request'))}
                >
                  <View style={[styles.actionIconCircle, styles.actionCircleRequest]}>
                    <Ionicons name="arrow-down" size={15} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.actionCardTitle, { color: '#92400E' }]}>Request</Text>
                  <Ionicons name="arrow-forward" size={12} color="#D97706" style={styles.actionArrow} />
                </TouchableOpacity>

                {/* 5. WALLET */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionPillCard, styles.actionPillWallet]}
                  onPress={() => (onNavigateToWallet ? onNavigateToWallet() : setActiveActionModal('Wallet'))}
                >
                  <View style={[styles.actionIconCircle, styles.actionCircleWallet]}>
                    <Ionicons name="wallet-outline" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.actionCardTitle, { color: '#5B21B6' }]}>Wallet</Text>
                  <Ionicons name="arrow-forward" size={12} color="#8B5CF6" style={styles.actionArrow} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Live xCoin Native Asset Spotlight & Interactive Sparkline Card */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View style={styles.tokenTitleRow}>
                <View style={styles.tokenMiniBadge}>
                  <Image
                    source={require('../../../assets/images/logo_transparent.png')}
                    style={styles.tokenMiniLogo}
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <View style={styles.tokenNameRow}>
                    <Text style={styles.tokenTitle}>xCoin / INR</Text>
                    <View style={styles.liveTag}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveTagText}>LIVE</Text>
                    </View>
                  </View>
                  <Text style={styles.tokenPrice}>{xCoinFormattedPrice}</Text>
                </View>
              </View>

              <View style={styles.chartHeaderRight}>
                <View style={styles.priceGrowthTag}>
                  <Ionicons name="trending-up" size={11} color="#05CD99" />
                  <Text style={styles.priceGrowthText}>+14.28%</Text>
                </View>
                <Text style={styles.chartVolText}>24h Vol ₹ 14.8 Cr</Text>
              </View>
            </View>

            {/* Micro Sparkline & Timeframe Selector in one sleek row */}
            <View style={styles.sparklineRow}>
              {/* Slender 24-Bar Modern Gradient Sparkline */}
              <View style={styles.sparklineVisual}>
                {[28, 34, 30, 42, 38, 46, 52, 48, 56, 62, 58, 66, 64, 72, 70, 78, 84, 80, 88, 92, 88, 95, 92, 100].map((h, i) => (
                  <View
                    key={i}
                    style={[
                      styles.sparklineBar,
                      {
                        height: `${h}%`,
                        opacity: 0.3 + (i / 24) * 0.7,
                        backgroundColor: i === 23 ? Colors.primary : '#6366F1',
                      },
                    ]}
                  />
                ))}
              </View>

              {/* Timeframe Pills */}
              <View style={styles.timeframeTabsCompact}>
                {(['1D', '1W', '1M', 'ALL'] as const).map((tf) => (
                  <TouchableOpacity
                    key={tf}
                    style={[
                      styles.timeframeTabCompact,
                      selectedTimeframe === tf && styles.timeframeTabCompactActive,
                    ]}
                    onPress={() => setSelectedTimeframe(tf as any)}
                  >
                    <Text
                      style={[
                        styles.timeframeTextCompact,
                        selectedTimeframe === tf && styles.timeframeTextCompactActive,
                      ]}
                    >
                      {tf}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Quick Earning Hub */}
          <View style={styles.promoRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.promoCard, { backgroundColor: '#F8F6FF', borderColor: '#EDE9FE' }]}
              onPress={onNavigateToTeam}
            >
              <View style={[styles.promoIconCircle, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="people" size={18} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.promoTitle}>Invite Friends</Text>
                <Text style={styles.promoDesc}>Earn trading commission</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#A0AEC0" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.promoCard, { backgroundColor: '#FFFBF0', borderColor: '#FEF3C7' }]}
              onPress={onNavigateToRewards}
            >
              <View style={[styles.promoIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="gift" size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.promoTitle}>Daily Rewards</Text>
                <Text style={styles.promoDesc}>Claim streak bonus</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#A0AEC0" />
            </TouchableOpacity>
          </View>

          {/* Market Assets Watchlist */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Market Assets</Text>
              <Text style={styles.sectionSub}>Top trading pairs by 24h volume</Text>
            </View>
            <TouchableOpacity onPress={onNavigateToOrders} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterPillsRow}>
            {(['Hot', 'Gainers', 'New'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setSelectedTab(tab)}
                style={[
                  styles.filterPill,
                  selectedTab === tab && styles.filterPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedTab === tab && styles.filterPillTextActive,
                  ]}
                >
                  {tab === 'Hot' ? 'Hot' : tab === 'Gainers' ? 'Top Gainers' : 'New'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Token List Card with Authentic Crypto Monograms */}
          <View style={styles.tokensList}>
            {filteredTokens.map((token, index) => (
              <TouchableOpacity
                key={token.id}
                activeOpacity={0.7}
                onPress={onNavigateToOrders}
                style={[
                  styles.tokenRow,
                  index === filteredTokens.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.tokenLeft}>
                  {token.isZappPay ? (
                    <View style={styles.tokenZapBadge}>
                      <Image
                        source={require('../../../assets/images/logo_transparent.png')}
                        style={styles.tokenZapLogo}
                        resizeMode="contain"
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.tokenIconBadge,
                        { backgroundColor: token.badgeColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tokenGlyphText,
                          token.isTextBadge && styles.tokenSmallGlyph,
                        ]}
                      >
                        {token.glyph}
                      </Text>
                    </View>
                  )}
                  <View>
                    <View style={styles.symbolRow}>
                      <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                      {token.tag && (
                        <View style={styles.nativeBadge}>
                          <Text style={styles.nativeBadgeText}>{token.tag}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.tokenName}>{token.name}</Text>
                  </View>
                </View>

                <View style={styles.tokenRight}>
                  <Text style={styles.tokenRowPrice}>{token.price}</Text>
                  <View
                    style={[
                      styles.changeBadge,
                      {
                        backgroundColor: token.isPositive
                          ? '#E6FAF5'
                          : '#FEEFEE',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tokenRowChange,
                        {
                          color: token.isPositive
                            ? Colors.success
                            : Colors.danger,
                        },
                      ]}
                    >
                      {token.change}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Institutional Trust & Cold Storage Footnote */}
          <View style={styles.trustBanner}>
            <View style={styles.trustSealBadge}>
              <Ionicons name="shield-checkmark" size={17} color="#05CD99" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trustBannerTitle}>Bank-Grade 256-Bit Protection</Text>
              <Text style={styles.trustBannerSub}>
                100% cold storage vaults • Insured reserves • FIU-IND registered
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Interactive Action Hub Modal (Buy / Sell / UPI / Wallet) */}
        <Modal
          visible={activeActionModal !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveActionModal(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              {/* Modal Header */}
              <View style={styles.modalTopBar}>
                <View style={styles.modalTitleRow}>
                  <View
                    style={[
                      styles.modalIconCircle,
                      activeActionModal === 'Buy' && { backgroundColor: '#E6FAF5' },
                      activeActionModal === 'Sell' && { backgroundColor: '#FEEFEE' },
                      activeActionModal === 'UPI' && { backgroundColor: '#FFF7EB' },
                      activeActionModal === 'Request' && { backgroundColor: '#FEF3C7' },
                      activeActionModal === 'Wallet' && { backgroundColor: '#EFF6FF' },
                    ]}
                  >
                    <Ionicons
                      name={
                        activeActionModal === 'Buy'
                          ? 'arrow-down-circle'
                          : activeActionModal === 'Sell'
                          ? 'arrow-up-circle'
                          : activeActionModal === 'UPI'
                          ? 'flash'
                          : activeActionModal === 'Request'
                          ? 'arrow-down'
                          : 'wallet'
                      }
                      size={26}
                      color={
                        activeActionModal === 'Buy'
                          ? '#05CD99'
                          : activeActionModal === 'Sell'
                          ? '#EE5D50'
                          : activeActionModal === 'UPI'
                          ? '#FFB547'
                          : activeActionModal === 'Request'
                          ? '#D97706'
                          : Colors.primary
                      }
                    />
                  </View>
                  <View>
                    <Text style={styles.modalHeading}>
                      {activeActionModal === 'Buy' && 'Instant Buy Crypto'}
                      {activeActionModal === 'Sell' && 'Instant Sell to Bank'}
                      {activeActionModal === 'UPI' && 'UPI Instant Gateway'}
                      {activeActionModal === 'Request' && 'Payment Request'}
                      {activeActionModal === 'Wallet' && 'Zapp Pay Web3 Vault'}
                    </Text>
                    <Text style={styles.modalSubheading}>
                      {activeActionModal === 'Buy' && 'Zero fee INR instant payment via UPI'}
                      {activeActionModal === 'Sell' && 'Direct IMPS payout to registered bank'}
                      {activeActionModal === 'UPI' && 'Direct scan & pay via any UPI app'}
                      {activeActionModal === 'Request' && 'Request money via UPI ID, Phone, or QR code'}
                      {activeActionModal === 'Wallet' && 'Multi-signature cold storage vault'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setActiveActionModal(null)}
                  style={styles.modalCloseIconBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              {/* Modal Content - BUY */}
              {activeActionModal === 'Buy' && (
                <View style={styles.modalBodyContent}>
                  <Text style={styles.sectionMiniLabel}>SELECT PRESET AMOUNT</Text>
                  <View style={styles.presetAmountsRow}>
                    {['500', '1500', '5000', '10000'].map((amt) => (
                      <TouchableOpacity
                        key={amt}
                        style={[
                          styles.presetPill,
                          buyAmount === amt && styles.presetPillActive,
                        ]}
                        onPress={() => setBuyAmount(amt)}
                      >
                        <Text
                          style={[
                            styles.presetPillText,
                            buyAmount === amt && styles.presetPillTextActive,
                          ]}
                        >
                          ₹ {Number(amt).toLocaleString('en-IN')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.conversionBox}>
                    <View style={styles.conversionRow}>
                      <Text style={styles.conversionLabel}>Paying Amount</Text>
                      <Text style={styles.conversionValue}>₹ {Number(buyAmount || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.conversionRow}>
                      <Text style={styles.conversionLabel}>Est. xCoin Receiving</Text>
                      <Text style={[styles.conversionValue, { color: '#05CD99', fontWeight: '900' }]}>
                        ≈ {(Number(buyAmount || 0) / xCoinRate).toFixed(2)} xCoin
                      </Text>
                    </View>
                    <View style={[styles.conversionRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                      <Text style={styles.conversionLabel}>Gateway</Text>
                      <Text style={styles.conversionValue}>UPI Auto-Pay (0% Fee)</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: '#05CD99' }]}
                    onPress={() => {
                      setActiveActionModal(null);
                      Alert.alert(
                        'Buy Order Placed!',
                        `Purchased ${(Number(buyAmount || 0) / xCoinRate).toFixed(2)} xCoin for ₹ ${buyAmount} via UPI. Check your order history.`,
                        [
                          { text: 'View Orders', onPress: onNavigateToOrders },
                          { text: 'Done', style: 'cancel' },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="flash" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryActionBtnText}>Proceed to UPI Payment</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Modal Content - SELL */}
              {activeActionModal === 'Sell' && (
                <View style={styles.modalBodyContent}>
                  <View style={styles.balanceNoticeBox}>
                    <Text style={styles.balanceNoticeLabel}>Available for Liquidation</Text>
                    <Text style={styles.balanceNoticeValue}>
                      {xCoinBalance.toFixed(2)} xCoin (≈ ₹ {(xCoinBalance * xCoinRate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </Text>
                  </View>

                  <Text style={styles.sectionMiniLabel}>SELECT AMOUNT TO SELL</Text>
                  <View style={styles.presetAmountsRow}>
                    {['25%', '50%', '75%', '100%'].map((pct) => (
                      <TouchableOpacity
                        key={pct}
                        style={styles.presetPill}
                        onPress={() => {}}
                      >
                        <Text style={styles.presetPillText}>{pct}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.conversionBox}>
                    <View style={styles.conversionRow}>
                      <Text style={styles.conversionLabel}>Payout Destination</Text>
                      <Text style={styles.conversionValue}>
                        {user?.bankAccount?.bankName
                          ? `${user.bankAccount.bankName} •••• ${user.bankAccount.accountNumber?.slice(-4) || '4892'}`
                          : 'Primary Bank Account'}
                      </Text>
                    </View>
                    <View style={styles.conversionRow}>
                      <Text style={styles.conversionLabel}>Settlement Speed</Text>
                      <Text style={[styles.conversionValue, { color: '#05CD99' }]}>Instant IMPS (under 30s)</Text>
                    </View>
                    <View style={[styles.conversionRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                      <Text style={styles.conversionLabel}>Platform Charge</Text>
                      <Text style={styles.conversionValue}>₹ 0.00 (Zero Fee)</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: '#EE5D50' }]}
                    onPress={() => {
                      setActiveActionModal(null);
                      Alert.alert(
                        'Sell Order Initiated!',
                        `Funds are being transferred via IMPS to your ${user?.bankAccount?.bankName || 'linked bank'} account. Status is Processing.`,
                        [
                          { text: 'View Orders', onPress: onNavigateToOrders },
                          { text: 'Done', style: 'cancel' },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryActionBtnText}>Confirm Instant Withdrawal</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Modal Content - UPI */}
              {activeActionModal === 'UPI' && (
                <View style={styles.modalBodyContent}>
                  <View style={styles.vpaDisplayCard}>
                    <View>
                      <Text style={styles.vpaLabel}>OFFICIAL ZAPP PAY UPI ID</Text>
                      <Text style={styles.vpaValue}>zapppay@icici</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.copyBtn}
                      onPress={() => {
                        setCopiedVpa(true);
                        setTimeout(() => setCopiedVpa(false), 2000);
                      }}
                    >
                      <Ionicons
                        name={copiedVpa ? 'checkmark' : 'copy-outline'}
                        size={15}
                        color={copiedVpa ? '#05CD99' : Colors.primary}
                      />
                      <Text style={[styles.copyBtnText, copiedVpa && { color: '#05CD99' }]}>
                        {copiedVpa ? 'Copied' : 'Copy'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.sectionMiniLabel}>SUPPORTED UPI APPS</Text>
                  <View style={styles.upiAppsRow}>
                    <View style={styles.upiAppBadge}>
                      <Text style={styles.upiAppText}>PhonePe</Text>
                    </View>
                    <View style={styles.upiAppBadge}>
                      <Text style={styles.upiAppText}>Google Pay</Text>
                    </View>
                    <View style={styles.upiAppBadge}>
                      <Text style={styles.upiAppText}>Paytm</Text>
                    </View>
                    <View style={styles.upiAppBadge}>
                      <Text style={styles.upiAppText}>BHIM</Text>
                    </View>
                  </View>

                  <View style={styles.upiNoticeBox}>
                    <Ionicons name="shield-checkmark" size={16} color="#05CD99" />
                    <Text style={styles.upiNoticeText}>
                      Deposits reflect automatically in your Zapp Pay wallet within 3-10 seconds.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: '#FFB547' }]}
                    onPress={() => {
                      setActiveActionModal(null);
                      Alert.alert('UPI Payment', 'Open your preferred UPI app and pay to zapppay@icici. Your balance will credit automatically.');
                    }}
                  >
                    <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryActionBtnText}>Pay with UPI App</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Modal Content - WALLET */}
              {activeActionModal === 'Wallet' && (
                <View style={styles.modalBodyContent}>
                  <View style={styles.walletVaultCard}>
                    <View style={styles.vaultTop}>
                      <Text style={styles.vaultTitle}>Main Web3 Vault</Text>
                      <View style={styles.vaultSecureBadge}>
                        <View style={styles.secureDot} />
                        <Text style={styles.secureText}>Cold Secured</Text>
                      </View>
                    </View>
                    <Text style={styles.vaultBalance}>{xCoinBalance.toFixed(2)} xCoin</Text>
                    <Text style={styles.vaultFiat}>≈ ₹ {(xCoinBalance * xCoinRate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR</Text>
                  </View>

                  <View style={styles.addressDisplayCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vpaLabel}>YOUR DEPOSIT ADDRESS</Text>
                      <Text style={styles.addressValue} numberOfLines={1} ellipsizeMode="middle">
                        {user?.walletAddress || 'Decentralized Vault'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.copyBtn}
                      onPress={() => {
                        setCopiedAddress(true);
                        setTimeout(() => setCopiedAddress(false), 2000);
                      }}
                    >
                      <Ionicons
                        name={copiedAddress ? 'checkmark' : 'copy-outline'}
                        size={15}
                        color={copiedAddress ? '#05CD99' : Colors.primary}
                      />
                      <Text style={[styles.copyBtnText, copiedAddress && { color: '#05CD99' }]}>
                        {copiedAddress ? 'Copied' : 'Copy'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: Colors.primary }]}
                    onPress={() => {
                      setActiveActionModal(null);
                      if (onNavigateToOrders) {
                        onNavigateToOrders();
                      }
                    }}
                  >
                    <Ionicons name="receipt-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryActionBtnText}>View Order & Transfer History</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Modal Content - REQUEST */}
              {activeActionModal === 'Request' && (
                <View style={styles.modalBodyContent}>
                  <View style={styles.walletVaultCard}>
                    <View style={styles.vaultTop}>
                      <Text style={styles.vaultTitle}>Instant Payment Request</Text>
                      <View style={[styles.vaultSecureBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                        <Ionicons name="flash" size={11} color="#F59E0B" />
                        <Text style={[styles.secureText, { color: '#D97706' }]}>Zero Fee</Text>
                      </View>
                    </View>
                    <Text style={styles.vaultBalance}>₹ {buyAmount}</Text>
                    <Text style={styles.vaultFiat}>Request payment from any UPI or Web3 user</Text>
                  </View>

                  <View style={styles.addressDisplayCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vpaLabel}>YOUR RECEIVING UPI ID</Text>
                      <Text style={styles.addressValue} numberOfLines={1}>
                        {user?.upiId || 'zapppay@icici'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.copyBtn}
                      onPress={() => {
                        setCopiedVpa(true);
                        setTimeout(() => setCopiedVpa(false), 2000);
                      }}
                    >
                      <Ionicons
                        name={copiedVpa ? 'checkmark' : 'copy-outline'}
                        size={15}
                        color={copiedVpa ? '#05CD99' : Colors.primary}
                      />
                      <Text style={[styles.copyBtnText, copiedVpa && { color: '#05CD99' }]}>
                        {copiedVpa ? 'Copied' : 'Copy'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: '#F59E0B' }]}
                    onPress={() => {
                      setActiveActionModal(null);
                      if (onNavigateToRequest) {
                        onNavigateToRequest();
                      } else {
                        Alert.alert('Payment Request', `Payment request link for ₹${buyAmount} generated!`);
                      }
                    }}
                  >
                    <Ionicons name="arrow-down-circle" size={17} color="#FFFFFF" />
                    <Text style={styles.primaryActionBtnText}>Open Request Studio</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Interactive Notifications Sheet Modal */}
        <Modal
          visible={showNotificationsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowNotificationsModal(false)}
        >
          <View style={styles.notifModalBackdrop}>
            <View style={styles.notifModalCard}>
              <View style={styles.notifModalHeader}>
                <View style={styles.notifModalTitleRow}>
                  <View style={styles.notifHeaderIconWrapper}>
                    <Ionicons name="notifications" size={18} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.notifModalTitle}>Notifications</Text>
                    <Text style={styles.notifModalSubtitle}>
                      {notifications.filter((n) => n.unread).length} unread updates
                    </Text>
                  </View>
                </View>
                <View style={styles.notifModalHeaderActions}>
                  {notifications.some((n) => n.unread) && (
                    <TouchableOpacity
                      onPress={handleMarkAllNotificationsRead}
                      style={styles.markReadBtn}
                    >
                      <Text style={styles.markReadBtnText}>Mark all read</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => setShowNotificationsModal(false)}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={18} color="#707EAE" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.notifList}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                {notifications.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    style={[styles.notifItem, item.unread && styles.notifItemUnread]}
                    onPress={() => {
                      handleMarkNotificationRead(item.id);
                    }}
                  >
                    <View
                      style={[
                        styles.notifIconBox,
                        item.type === 'deposit' && { backgroundColor: '#E6FAF5' },
                        item.type === 'surge' && { backgroundColor: '#EFF6FF' },
                        item.type === 'vip' && { backgroundColor: '#FFF7EB' },
                        item.type === 'security' && { backgroundColor: '#F3E8FF' },
                      ]}
                    >
                      <Ionicons
                        name={
                          item.type === 'deposit'
                            ? 'wallet-outline'
                            : item.type === 'surge'
                            ? 'trending-up-outline'
                            : item.type === 'vip'
                            ? 'star-outline'
                            : 'shield-checkmark-outline'
                        }
                        size={18}
                        color={
                          item.type === 'deposit'
                            ? '#05CD99'
                            : item.type === 'surge'
                            ? Colors.primary
                            : item.type === 'vip'
                            ? '#FFB547'
                            : '#9333EA'
                        }
                      />
                    </View>
                    <View style={styles.notifContent}>
                      <View style={styles.notifTopRow}>
                        <Text style={styles.notifItemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.notifItemTime}>{item.time}</Text>
                      </View>
                      <Text style={styles.notifItemDesc}>{item.message}</Text>
                    </View>
                    {item.unread && <View style={styles.notifUnreadDot} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Interactive Quick QR Scanner Modal */}
        <Modal
          visible={showQrModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQrModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.qrModalCard}>
              <View style={styles.qrModalHeader}>
                <View style={styles.qrHeaderLeft}>
                  <View style={styles.qrHeaderIconBox}>
                    <Ionicons name="qr-code" size={18} color="#05CD99" />
                  </View>
                  <View>
                    <Text style={styles.qrModalTitle}>Instant QR Scanner</Text>
                    <Text style={styles.qrModalSubtitle}>Pay via UPI or Transfer Crypto</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowQrModal(false)}
                  style={styles.modalCloseIconBtn}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              <View style={styles.qrScannerFrame}>
                <View style={styles.scannerCornerTopLeft} />
                <View style={styles.scannerCornerTopRight} />
                <View style={styles.scannerCornerBottomLeft} />
                <View style={styles.scannerCornerBottomRight} />

                <Ionicons name="camera-outline" size={44} color="#64748B" />
                <Text style={styles.scannerInstructionText}>
                  Point camera at any UPI QR code or Web3 address
                </Text>
                <View style={styles.scannerLaserLine} />
              </View>

              <View style={styles.qrActionsRow}>
                <TouchableOpacity
                  style={styles.qrActionBtn}
                  onPress={() => {
                    setShowQrModal(false);
                    if (onNavigateToUpi) onNavigateToUpi();
                    else setActiveActionModal('UPI');
                  }}
                >
                  <Ionicons name="flash-outline" size={16} color={Colors.primary} />
                  <Text style={styles.qrActionBtnText}>Instant UPI Pay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.qrActionBtnSecondary}
                  onPress={() => {
                    setShowQrModal(false);
                    Alert.alert('Simulated Scan', `Address ${user?.walletAddress || 'Vault Address'} recognized from QR code.`);
                  }}
                >
                  <Ionicons name="image-outline" size={16} color="#707EAE" />
                  <Text style={styles.qrActionBtnSecondaryText}>Upload QR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Network & Protocol Status Modal */}
        <Modal
          visible={showNetworkModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNetworkModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.networkModalCard}>
              <View style={styles.networkModalHeader}>
                <View style={styles.networkBrandRow}>
                  <Image
                    source={require('../../../assets/images/logo_transparent.png')}
                    style={{ width: 32, height: 32 }}
                    resizeMode="contain"
                  />
                  <View>
                    <Text style={styles.networkTitle}>Zapp Pay Mainnet v1.4</Text>
                    <View style={styles.liveBadgeRow}>
                      <View style={styles.livePulseDot} />
                      <Text style={styles.liveStatusText}>All Systems Normal • 100% Uptime</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowNetworkModal(false)}
                  style={styles.modalCloseIconBtn}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              <View style={styles.networkStatsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>BLOCK HEIGHT</Text>
                  <Text style={styles.statVal}>{networkStats.blockHeight}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>AVG BLOCK TIME</Text>
                  <Text style={styles.statVal}>{networkStats.avgBlockTime}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>NETWORK TPS</Text>
                  <Text style={styles.statVal}>{networkStats.tps}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>GAS FEE</Text>
                  <Text style={[styles.statVal, { color: '#05CD99' }]}>{networkStats.gasFee}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeNetworkBtn}
                onPress={() => setShowNetworkModal(false)}
              >
                <Text style={styles.closeNetworkBtnText}>Got it</Text>
              </TouchableOpacity>
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

  // Top Header - Mobile Ergonomics & Luxury Styling
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  userProfileTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
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
    shadowColor: Colors.primary,
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
    fontWeight: '600',
    color: '#707EAE',
    letterSpacing: 0.2,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B2559',
    letterSpacing: -0.2,
    maxWidth: 135,
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
    marginTop: 2.5,
  },
  vipMiniBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: '#FDE68A',
  },
  vipMiniText: {
    fontSize: 9,
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
    gap: 6,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
    position: 'relative',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerBrandBadge: {
    width: 36,
    height: 36,
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
    width: 24,
    height: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EE5D50',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notificationBadgeCount: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11,
  },

  // Notification Modal Styles
  notifModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  notifModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 18,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  notifModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notifModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifHeaderIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B2559',
  },
  notifModalSubtitle: {
    fontSize: 11.5,
    color: '#707EAE',
    fontWeight: '600',
  },
  notifModalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markReadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F4F7FE',
  },
  markReadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F7FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifList: {
    marginTop: 10,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
    gap: 12,
  },
  notifItemUnread: {
    backgroundColor: '#F8FAFC',
    borderColor: '#DBEAFE',
  },
  notifIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  notifItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
    flex: 1,
    marginRight: 6,
  },
  notifItemTime: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#A3AED0',
  },
  notifItemDesc: {
    fontSize: 11.5,
    color: '#4A5568',
    lineHeight: 16,
  },
  notifUnreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },

  // QR Modal Styles
  qrModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    width: '92%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qrHeaderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E6FAF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B2559',
  },
  qrModalSubtitle: {
    fontSize: 11.5,
    color: '#707EAE',
    fontWeight: '600',
  },
  qrScannerFrame: {
    height: 200,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: 16,
    marginBottom: 16,
  },
  scannerCornerTopLeft: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#05CD99',
    borderTopLeftRadius: 6,
  },
  scannerCornerTopRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#05CD99',
    borderTopRightRadius: 6,
  },
  scannerCornerBottomLeft: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#05CD99',
    borderBottomLeftRadius: 6,
  },
  scannerCornerBottomRight: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#05CD99',
    borderBottomRightRadius: 6,
  },
  scannerInstructionText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  scannerLaserLine: {
    position: 'absolute',
    width: '80%',
    height: 2,
    backgroundColor: '#05CD99',
    top: '50%',
    shadowColor: '#05CD99',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  qrActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  qrActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  qrActionBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: Colors.primary,
  },
  qrActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrActionBtnSecondaryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },

  // Network Status Modal
  networkModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    width: '92%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  networkModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  networkBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  networkTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B2559',
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#05CD99',
  },
  liveStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#05CD99',
  },
  networkStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#707EAE',
    marginBottom: 3,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
  },
  closeNetworkBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeNetworkBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // Premium Unified Balance Card Section (Spacious, Breathable & Luxury)
  premiumBalanceWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    overflow: 'hidden',
  },
  cosmicBalanceCard: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    position: 'relative',
    overflow: 'hidden',
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
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  cosmicHeaderSubtitle: {
    fontSize: 11.5,
    color: '#8E9BB5',
    fontWeight: '500',
    marginTop: 1,
  },
  web3NetworkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  web3NetworkBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
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

  // Main Balance Row - Spacious & Breathable
  balanceMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
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
  profitHighlightCard: {
    backgroundColor: 'rgba(6, 78, 59, 0.45)',
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
  profitMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  profitMetricValue: {
    color: '#10B981',
    fontSize: 13.5,
    fontWeight: '800',
  },
  profitMetricLabel: {
    color: '#6EE7B7',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },

  // Wave Artwork
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    overflow: 'hidden',
  },
  cosmicWaveOne: {
    position: 'absolute',
    bottom: -18,
    left: -20,
    right: 30,
    height: 48,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 140,
    transform: [{ rotate: '-3deg' }],
  },
  cosmicWaveTwo: {
    position: 'absolute',
    bottom: -20,
    left: 50,
    right: -25,
    height: 44,
    borderTopLeftRadius: 140,
    borderTopRightRadius: 100,
    transform: [{ rotate: '4deg' }],
  },

  // Quick Actions Section - Perfectly Proportionate
  quickActionsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  quickActionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  quickActionsHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.2,
  },
  actionPillsGrid: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  actionPillCard: {
    flex: 1,
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    height: 86,
  },
  actionPillBuy: {
    backgroundColor: '#ECFDF5',
    borderColor: '#D1FAE5',
  },
  actionPillSell: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FFE4E6',
  },
  actionPillUpi: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  actionPillRequest: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  actionPillWallet: {
    backgroundColor: '#F5F3FF',
    borderColor: '#EDE9FE',
  },
  actionIconCircle: {
    width: 31,
    height: 31,
    borderRadius: 15.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 2.5,
    elevation: 2,
  },
  actionCircleBuy: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  actionCircleSell: {
    backgroundColor: '#F43F5E',
    shadowColor: '#F43F5E',
  },
  actionCircleUpi: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
  },
  actionCircleRequest: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  actionCircleWallet: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
  },
  actionCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  actionArrow: {
    marginTop: 1,
  },

  // Chart Card - Compact & Institutional
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 14,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tokenTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tokenMiniBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  tokenMiniLogo: {
    width: 22,
    height: 22,
  },
  tokenNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tokenTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1B2559',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E6FAF5',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#05CD99',
  },
  liveTagText: {
    color: '#05CD99',
    fontSize: 8.5,
    fontWeight: '900',
  },
  tokenPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1B2559',
    marginTop: 1,
  },
  chartHeaderRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  priceGrowthTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E6FAF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  priceGrowthText: {
    color: '#05CD99',
    fontSize: 11.5,
    fontWeight: '800',
  },
  chartVolText: {
    fontSize: 10.5,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 2,
  },
  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  sparklineVisual: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 30,
    width: 140,
    gap: 2.5,
  },
  sparklineBar: {
    width: 3.2,
    borderRadius: 1.5,
  },
  timeframeTabsCompact: {
    flexDirection: 'row',
    backgroundColor: '#F4F7FE',
    borderRadius: 8,
    padding: 2.5,
    gap: 2,
  },
  timeframeTabCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeframeTabCompactActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  timeframeTextCompact: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#707EAE',
  },
  timeframeTextCompactActive: {
    color: '#4318FF',
    fontWeight: '800',
  },

  // Promo Hub - Minimal Badges
  promoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  promoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  promoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
  },
  promoDesc: {
    fontSize: 10.5,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 2,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B2559',
  },
  sectionSub: {
    fontSize: 11.5,
    color: '#707EAE',
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    color: '#4318FF',
    fontWeight: '800',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#4318FF',
    borderColor: '#4318FF',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#707EAE',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Token List - Authentic Crypto Badges
  tokensList: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 18,
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F7FE',
  },
  tokenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tokenZapBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tokenZapLogo: {
    width: 28,
    height: 28,
  },
  tokenIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tokenGlyphText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },
  tokenSmallGlyph: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tokenSymbol: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B2559',
  },
  nativeBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nativeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4318FF',
  },
  tokenName: {
    fontSize: 12,
    color: '#707EAE',
    marginTop: 2,
    fontWeight: '500',
  },
  tokenRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  tokenRowPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B2559',
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tokenRowChange: {
    fontSize: 11.5,
    fontWeight: '800',
  },

  // Trust Banner
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    gap: 12,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  trustSealBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E6FAF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  trustSealCheck: {
    fontSize: 14,
    fontWeight: '900',
    color: '#05CD99',
  },
  trustBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
  },
  trustBannerSub: {
    fontSize: 11,
    color: '#707EAE',
    marginTop: 2,
    lineHeight: 15,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1B2559',
  },
  modalSubheading: {
    fontSize: 11,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 2,
    maxWidth: 220,
  },
  modalCloseIconBtn: {
    padding: 4,
  },
  modalBodyContent: {
    gap: 12,
  },
  sectionMiniLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.5,
  },
  presetAmountsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetPillActive: {
    backgroundColor: '#E6FAF5',
    borderColor: '#05CD99',
  },
  presetPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B2559',
  },
  presetPillTextActive: {
    color: '#05CD99',
    fontWeight: '900',
  },
  conversionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  conversionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  conversionLabel: {
    fontSize: 12,
    color: '#707EAE',
    fontWeight: '600',
  },
  conversionValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 4,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  balanceNoticeBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  balanceNoticeLabel: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600',
  },
  balanceNoticeValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E3A8A',
    marginTop: 2,
  },
  vpaDisplayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vpaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.5,
  },
  vpaValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1B2559',
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  upiAppsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  upiAppBadge: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  upiAppText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B2559',
  },
  upiNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E6FAF5',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  upiNoticeText: {
    fontSize: 11,
    color: '#05CD99',
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  walletVaultCard: {
    backgroundColor: '#0D0924',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  vaultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vaultTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#A5B4FC',
  },
  vaultSecureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 205, 153, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  secureDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#05CD99',
  },
  secureText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#05CD99',
  },
  vaultBalance: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  vaultFiat: {
    fontSize: 11.5,
    color: '#C7D2FE',
    fontWeight: '600',
    marginTop: 2,
  },
  addressDisplayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  addressValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1B2559',
    marginTop: 2,
  },
});
