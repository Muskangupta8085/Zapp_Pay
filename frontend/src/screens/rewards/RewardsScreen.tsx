import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ImageBackground,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { RewardsService, HomeService } from '../../services/api.service';

interface RewardsScreenProps {
  onBack?: () => void;
  onNavigateToBuy?: () => void;
  onNavigateToWallet?: () => void;
  onNavigateToTeam?: () => void;
}

interface MissionItem {
  id: string;
  title: string;
  subtitle: string;
  reward: string;
  rewardAmount: number;
  category: 'Beginner' | 'Trading' | 'Community';
  status: 'Claimed' | 'Claim' | 'In Progress' | 'Action';
  actionLabel?: string;
  progress?: number;
  progressText?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
}

interface HistoryItem {
  id: string;
  title: string;
  amount: string;
  fiatAmount: string;
  date: string;
  type: 'Streak' | 'Task' | 'Mystery' | 'Airdrop';
  txHash: string;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({
  onBack,
  onNavigateToBuy,
  onNavigateToWallet,
  onNavigateToTeam,
}) => {
  const insets = useSafeAreaInsets();
  const { user, refreshWallet } = useAuth();

  // State management
  const [hideRewards, setHideRewards] = useState(false);
  const [unclaimedBalance, setUnclaimedBalance] = useState(0.0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [activeTab, setActiveTab] = useState<'All' | 'Beginner' | 'Trading' | 'Community'>('All');
  const [mysteryBoxOpened, setMysteryBoxOpened] = useState(false);
  const [mysteryRewardWon, setMysteryRewardWon] = useState<number | null>(null);

  // Modals
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showMysteryModal, setShowMysteryModal] = useState(false);

  // 7-Day Check-in Streak Data
  const [streakDays, setStreakDays] = useState([
    { day: 'Day 1', reward: '+5', done: false, today: true },
    { day: 'Day 2', reward: '+10', done: false, today: false },
    { day: 'Day 3', reward: '+15', done: false, today: false },
    { day: 'Day 4', reward: '+20', done: false, today: false },
    { day: 'Day 5', reward: '+25', done: false, today: false },
    { day: 'Day 6', reward: '+30', done: false, today: false },
    { day: 'Day 7', reward: '100', done: false, today: false, mega: true },
  ]);

  // Tasks & Missions Data
  const [missions, setMissions] = useState<MissionItem[]>([
    {
      id: '1',
      title: 'Complete Identity KYC',
      subtitle: 'Upload Aadhaar & PAN verification',
      reward: '+50 xCoin',
      rewardAmount: 50,
      category: 'Beginner',
      status: user?.kycStatus === 'verified' ? 'Claimed' : (user?.kycStatus === 'pending' ? 'In Progress' : 'Action'),
      actionLabel: user?.kycStatus === 'verified' ? undefined : (user?.kycStatus === 'pending' ? 'Pending' : 'Verify'),
      icon: 'shield-checkmark',
      iconBg: '#E6FAF5',
      iconColor: '#05CD99',
    },
    {
      id: '2',
      title: 'First Crypto Deposit',
      subtitle: 'Deposit min ₹ 500 fiat or USDT equivalent',
      reward: '+100 xCoin',
      rewardAmount: 100,
      category: 'Beginner',
      status: 'Action',
      actionLabel: 'Deposit',
      icon: 'arrow-down-circle',
      iconBg: '#EEF2FF',
      iconColor: Colors.primary,
    },
    {
      id: '3',
      title: 'Execute 5 P2P Trades',
      subtitle: 'Complete 5 buy or sell trades on orderbook',
      reward: '+75 xCoin',
      rewardAmount: 75,
      category: 'Trading',
      status: 'Action',
      actionLabel: 'Trade',
      progress: 0,
      progressText: '0 / 5 Done (0%)',
      icon: 'swap-horizontal',
      iconBg: '#FFF7EB',
      iconColor: '#FFB547',
    },
    {
      id: '4',
      title: 'Invite 3 Trading Friends',
      subtitle: 'Earn bonuses when your referrals join',
      reward: '+200 xCoin',
      rewardAmount: 200,
      category: 'Community',
      status: 'Action',
      actionLabel: 'Invite',
      progress: 0,
      progressText: '0 / 3 Joined',
      icon: 'people',
      iconBg: '#F3E8FF',
      iconColor: '#9333EA',
    },
    {
      id: '5',
      title: 'Join Zapp Pay Telegram & Discord',
      subtitle: 'Stay updated with market signals and news',
      reward: '+25 xCoin',
      rewardAmount: 25,
      category: 'Community',
      status: 'Action',
      actionLabel: 'Join ➔',
      icon: 'paper-plane',
      iconBg: '#E0F2FE',
      iconColor: '#0284C7',
    },
  ]);

  // Sync KYC status changes
  React.useEffect(() => {
    if (user?.kycStatus) {
      setMissions((prev) =>
        prev.map((m) =>
          m.id === '1'
            ? {
                ...m,
                status: user.kycStatus === 'verified' ? 'Claimed' : (user.kycStatus === 'pending' ? 'In Progress' : 'Action'),
                actionLabel: user.kycStatus === 'verified' ? undefined : (user.kycStatus === 'pending' ? 'Pending' : 'Verify'),
              }
            : m
        )
      );
    }
  }, [user?.kycStatus]);

  // Rewards Claim History
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([
    {
      id: 'W-001',
      title: 'New Member Welcome Bounty',
      amount: '+100.00 xCoin',
      fiatAmount: '₹ 10,837.00',
      date: 'Account Activation',
      type: 'Airdrop',
      txHash: user?.walletAddress
        ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
        : '0xGenesis...0001',
    },
  ]);

  const [isLoadingRewards, setIsLoadingRewards] = useState(false);
  const [xCoinRate, setXCoinRate] = useState(108.37);

  const fetchRewardsData = async () => {
    try {
      setIsLoadingRewards(true);
      const [data, tickers] = await Promise.all([
        RewardsService.getOverview().catch(() => null),
        HomeService.getTickers().catch(() => null),
      ]);
      if (tickers && Array.isArray(tickers)) {
        const zap = tickers.find((t: any) => t.id === 'xcoin')?.rawPrice;
        if (zap) setXCoinRate(zap);
      }
      if (data) {
        if (Array.isArray(data.streakDays)) setStreakDays(data.streakDays);
        if (typeof data.currentStreak === 'number') setCurrentStreak(data.currentStreak);
        if (typeof data.unclaimedBalance === 'number') setUnclaimedBalance(data.unclaimedBalance);
        if (Array.isArray(data.missions)) setMissions(data.missions);
        if (Array.isArray(data.history)) setHistoryItems(data.history);
        if (data.mysteryBox) {
          setMysteryBoxOpened(!!data.mysteryBox.isOpened);
          if (data.mysteryBox.prize) setMysteryRewardWon(data.mysteryBox.prize);
        }
      }
    } catch {
      // Keep defaults
    } finally {
      setIsLoadingRewards(false);
    }
  };

  useEffect(() => {
    fetchRewardsData();
  }, [user]);

  // Daily Streak Claim
  const handleCheckInToday = async () => {
    try {
      const res = await RewardsService.checkIn();
      if (res?.success) {
        Alert.alert(
          '🎉 Check-In Complete!',
          res.message || 'Daily check-in streak reward has been added to your pool!'
        );
        await fetchRewardsData();
        refreshWallet();
      } else {
        Alert.alert('Check-In', res?.message || 'Already checked in today.');
      }
    } catch (err: any) {
      Alert.alert('Check-In', err?.response?.data?.message || err?.message || 'Check-in request processed.');
      await fetchRewardsData();
      refreshWallet();
    }
  };

  // Claim specific mission
  const handleMissionAction = async (mission: MissionItem) => {
    if (mission.status === 'Claimed') return;

    if (mission.status === 'Claim') {
      try {
        const res = await RewardsService.claimMission(mission.id);
        if (res?.success) {
          Alert.alert(
            '🏆 Reward Claimed!',
            res.message || `Successfully claimed ${mission.reward}. The tokens are now in your rewards pool.`
          );
          await fetchRewardsData();
          refreshWallet();
        } else {
          Alert.alert('Claim Reward', res?.message || 'Could not claim reward.');
        }
      } catch (err: any) {
        Alert.alert('Claim', err?.response?.data?.message || err?.message || 'Claim processed.');
        await fetchRewardsData();
        refreshWallet();
      }
    } else if (mission.category === 'Trading') {
      if (onNavigateToBuy) onNavigateToBuy();
      else Alert.alert('Trade Mission', 'Execute buy/sell trades to finish this task.');
    } else if (mission.category === 'Community') {
      if (onNavigateToTeam) onNavigateToTeam();
      else Alert.alert('Community Mission', `Share your referral code (${user?.referralCode || 'ZAP'}) to invite partners.`);
    } else {
      Alert.alert('Community Task', 'Opening Zapp Pay Official Telegram channel...');
    }
  };

  // Claim all pooled rewards
  const handleClaimAll = async () => {
    if (unclaimedBalance <= 0) {
      Alert.alert('No Rewards', 'All available rewards have already been claimed.');
      return;
    }

    try {
      const res = await RewardsService.claimAll();
      if (res?.success) {
        Alert.alert(
          '🎉 All Rewards Claimed!',
          res.message || `${unclaimedBalance.toFixed(2)} xCoin transferred to your Primary Wallet with 0 network gas fees.`,
          [
            {
              text: 'View in Wallet',
              onPress: () => onNavigateToWallet && onNavigateToWallet(),
            },
            { text: 'Done', style: 'default' },
          ]
        );
        await fetchRewardsData();
        refreshWallet();
      } else {
        Alert.alert('Claim All', res?.message || 'Unable to claim pooled rewards.');
      }
    } catch (err: any) {
      Alert.alert('Claim All', err?.response?.data?.message || err?.message || 'Claim completed.');
      await fetchRewardsData();
      refreshWallet();
    }
  };

  // Open Mystery Box
  const handleOpenMysteryBox = async () => {
    if (mysteryBoxOpened) {
      Alert.alert('Already Opened', 'You have already claimed this milestone mystery box.');
      return;
    }

    try {
      const res = await RewardsService.openMysteryBox();
      if (res?.success) {
        const prize = res.data?.rewardAmount || 88;
        setMysteryRewardWon(prize);
        setMysteryBoxOpened(true);
        setShowMysteryModal(true);
        await fetchRewardsData();
        refreshWallet();
      } else {
        Alert.alert('Mystery Box', res?.message || 'Reach Day 7 streak to unlock the Mystery Box!');
      }
    } catch (err: any) {
      Alert.alert('Mystery Box', err?.response?.data?.message || err?.message || 'Reach Day 7 streak to unlock the Mystery Box!');
    }
  };

  // Filtered Missions
  const filteredMissions = missions.filter((m) => {
    if (activeTab === 'All') return true;
    return m.category === activeTab;
  });

  return (
    <ImageBackground
      source={require('../../../assets/images/onboarding_bg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* Top Header Bar - Dedicated to Rewards & Loyalty Center */}
        <View
          style={[
            styles.topHeader,
            { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 12 : 20) + 6 },
          ]}
        >
          {/* Left: Back button (if present) + Title & VIP Loyalty Badge */}
          <View style={styles.headerTitleBlock}>
            <View style={styles.titleRow}>
              {onBack && (
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={onBack}
                  activeOpacity={0.7}
                  accessibilityLabel="Back"
                >
                  <Ionicons name="arrow-back" size={18} color="#1B2559" />
                </TouchableOpacity>
              )}
              <Text style={styles.screenTitle}>Rewards</Text>
              <View style={styles.tierLoyaltyPill}>
                <Ionicons name="trophy" size={11} color="#D97706" />
                <Text style={styles.tierLoyaltyPillText}>VIP Tier 2 • 1.5x</Text>
              </View>
            </View>
            <Text style={styles.screenSubtitle}>
              Daily check-ins, airdrops & mission bounties
            </Text>
          </View>

          {/* Right: History & Rules Tools */}
          <View style={styles.headerRightActions}>
            {/* Rewards History Button */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.toolIconBtn}
              onPress={() => setShowHistoryModal(true)}
              accessibilityLabel="Rewards History"
            >
              <Ionicons name="receipt-outline" size={17} color="#1B2559" />
            </TouchableOpacity>

            {/* VIP Rules & Tiers Button */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.toolIconBtn}
              onPress={() => setShowRulesModal(true)}
              accessibilityLabel="Rewards Rules"
            >
              <Ionicons name="help-circle-outline" size={18} color="#1B2559" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* MASTER REWARDS VAULT HERO CARD - Cosmic Royal Violet & Midnight */}
          <LinearGradient
            colors={['#1E1B4B', '#2E1065', '#3B0764', '#1E1B4B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vaultHeroCard}
          >
            {/* Top Row: Title + Zero Gas Fee Capsule */}
            <View style={styles.vaultHeaderRow}>
              <View style={styles.vaultTitleGroup}>
                <View style={styles.vaultIconCircle}>
                  <Ionicons name="sparkles" size={16} color="#A78BFA" />
                </View>
                <View>
                  <Text style={styles.vaultHeaderTitle}>Rewards Pool Vault</Text>
                  <Text style={styles.vaultHeaderSubtitle}>Instant On-Chain Distribution</Text>
                </View>
              </View>

              <View style={styles.zeroGasCapsule}>
                <Ionicons name="flash" size={12} color="#10B981" />
                <Text style={styles.zeroGasCapsuleText}>0% Gas Fee</Text>
              </View>
            </View>

            {/* Main Figures Row */}
            <View style={styles.vaultFiguresRow}>
              <View style={styles.vaultFiguresCol}>
                <View style={styles.tokenLabelEyeRow}>
                  <Text style={styles.vaultAmountLabel}>Claimable Rewards</Text>
                  <TouchableOpacity
                    onPress={() => setHideRewards(!hideRewards)}
                    style={styles.compactEyeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={hideRewards ? 'eye-off-outline' : 'eye-outline'}
                      size={14}
                      color="#C4B5FD"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.amountNumberRow}>
                  <Text style={styles.vaultBalanceDigits}>
                    {hideRewards ? '••••••••' : unclaimedBalance.toFixed(2)}
                  </Text>
                  <Text style={styles.vaultBalanceCurrency}>
                    {hideRewards ? '' : ' xCoin'}
                  </Text>
                </View>

                <Text style={styles.vaultFiatEquivalent}>
                  {hideRewards
                    ? '••••••'
                    : `≈ ₹ ${(unclaimedBalance * xCoinRate).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} INR`}
                </Text>
              </View>

              {/* Action Button: Claim All */}
              <TouchableOpacity
                style={[
                  styles.claimAllHeroBtn,
                  unclaimedBalance <= 0 && styles.claimAllHeroBtnDisabled,
                ]}
                onPress={handleClaimAll}
                activeOpacity={0.85}
              >
                <View style={styles.claimAllBtnContent}>
                  <Ionicons
                    name={unclaimedBalance > 0 ? 'flash' : 'checkmark-circle'}
                    size={13}
                    color="#FFFFFF"
                  />
                  <Text style={styles.claimAllBtnText}>
                    {unclaimedBalance > 0 ? 'Claim All' : 'Settled'}
                  </Text>
                </View>
                <Text style={styles.claimAllBtnSub}>
                  {unclaimedBalance > 0 ? 'Direct to Wallet' : '0 Pending'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick 3-Metric Stats Ribbon */}
            <View style={styles.statsRibbon}>
              <View style={styles.ribbonItem}>
                <View style={styles.ribbonIconRow}>
                  <Ionicons name="flame" size={13} color="#F97316" />
                  <Text style={styles.ribbonLabel}>Streak</Text>
                </View>
                <Text style={styles.ribbonVal}>{currentStreak} Days</Text>
                <Text style={styles.ribbonSub}>Consecutive</Text>
              </View>

              <View style={styles.ribbonDivider} />

              <View style={styles.ribbonItem}>
                <View style={styles.ribbonIconRow}>
                  <Ionicons name="checkmark-done-circle" size={13} color="#10B981" />
                  <Text style={styles.ribbonLabel}>Missions</Text>
                </View>
                <Text style={styles.ribbonVal}>2 / 5 Done</Text>
                <Text style={styles.ribbonSub}>Active Quest</Text>
              </View>

              <View style={styles.ribbonDivider} />

              <View style={styles.ribbonItem}>
                <View style={styles.ribbonIconRow}>
                  <Ionicons name="diamond" size={13} color="#38BDF8" />
                  <Text style={styles.ribbonLabel}>Multiplier</Text>
                </View>
                <Text style={styles.ribbonVal}>1.5x APY</Text>
                <Text style={styles.ribbonSub}>VIP Level 2</Text>
              </View>
            </View>
          </LinearGradient>

          {/* 7-DAY DAILY CHECK-IN STREAK SECTION */}
          <View style={styles.streakSectionCard}>
            <View style={styles.streakSectionHeader}>
              <View>
                <View style={styles.streakTitleRow}>
                  <Text style={styles.streakSectionTitle}>Daily Check-in Streak</Text>
                  <View style={styles.streakFlamePill}>
                    <Ionicons name="flame" size={12} color="#F97316" />
                    <Text style={styles.streakFlameText}>{currentStreak} Days</Text>
                  </View>
                </View>
                <Text style={styles.streakSubtitle}>
                  Check in 7 consecutive days for the Day 7 Mega Reward!
                </Text>
              </View>
            </View>

            {/* Horizontal 7-Day Matrix */}
            <View style={styles.streakGridRow}>
              {streakDays.map((item, index) => {
                const isActionableToday = item.today && !item.done;
                const isClaimed = item.done;

                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={isActionableToday ? 0.8 : 1}
                    onPress={isActionableToday ? handleCheckInToday : undefined}
                    style={[
                      styles.streakDayBox,
                      isClaimed && styles.streakDayBoxClaimed,
                      isActionableToday && styles.streakDayBoxToday,
                      item.mega && styles.streakDayBoxMega,
                    ]}
                  >
                    <Text
                      style={[
                        styles.streakDayTitle,
                        isClaimed && styles.streakDayTitleClaimed,
                        isActionableToday && styles.streakDayTitleToday,
                      ]}
                    >
                      {item.day}
                    </Text>

                    <View style={styles.streakIconCircle}>
                      {isClaimed ? (
                        <Ionicons name="checkmark" size={13} color="#05CD99" />
                      ) : item.mega ? (
                        <Ionicons name="gift" size={14} color="#D97706" />
                      ) : (
                        <Text style={styles.streakCoinValText}>{item.reward}</Text>
                      )}
                    </View>

                    {isActionableToday ? (
                      <View style={styles.checkInPill}>
                        <Text style={styles.checkInPillText}>Claim</Text>
                      </View>
                    ) : (
                      <Text style={styles.streakBottomLabel}>
                        {isClaimed ? 'Done' : item.mega ? 'Mega' : 'xCoin'}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* EXCLUSIVE MYSTERY LOOT BOX BANNER */}
          <LinearGradient
            colors={['#1E293B', '#0F172A', '#1E1B4B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mysteryBoxBanner}
          >
            <View style={styles.mysteryLeftCol}>
              <View style={styles.mysteryIconBox}>
                <Ionicons name="cube" size={24} color="#FBBF24" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.mysteryBadgeRow}>
                  <Text style={styles.mysteryTitle}>Diamond Mystery Box</Text>
                  <View style={styles.mysteryAvailablePill}>
                    <Text style={styles.mysteryAvailableText}>
                      {mysteryBoxOpened ? 'Opened' : '1 Ready'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.mysterySub}>
                  Milestone unlocked! Win up to 500 xCoin instant airdrop.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.mysteryActionBtn,
                mysteryBoxOpened && styles.mysteryActionBtnDone,
              ]}
              onPress={handleOpenMysteryBox}
              activeOpacity={0.8}
            >
              <Ionicons
                name={mysteryBoxOpened ? 'checkmark-circle' : 'sparkles'}
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.mysteryActionBtnText}>
                {mysteryBoxOpened ? 'Opened' : 'Open Box'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* MISSIONS & QUESTS CENTER */}
          <View style={styles.missionsHeaderRow}>
            <View>
              <Text style={styles.missionsSectionTitle}>Missions & Quests</Text>
              <Text style={styles.missionsSectionSubtitle}>
                Complete tasks to earn ongoing xCoin rewards
              </Text>
            </View>
          </View>

          {/* Mission Filter Tabs */}
          <View style={styles.missionTabsRow}>
            {(['All', 'Beginner', 'Trading', 'Community'] as const).map((tab) => {
              const isSelected = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.missionTabBtn, isSelected && styles.missionTabBtnActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.missionTabBtnText,
                      isSelected && styles.missionTabBtnTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Missions List */}
          <View style={styles.missionsList}>
            {filteredMissions.map((mission) => {
              const isClaimed = mission.status === 'Claimed';
              const canClaim = mission.status === 'Claim';

              return (
                <View key={mission.id} style={styles.missionCard}>
                  {/* Left: Icon & Description */}
                  <View style={styles.missionLeftCol}>
                    <View
                      style={[
                        styles.missionIconBox,
                        { backgroundColor: mission.iconBg },
                      ]}
                    >
                      <Ionicons
                        name={mission.icon}
                        size={20}
                        color={mission.iconColor}
                      />
                    </View>

                    <View style={styles.missionInfoCol}>
                      <View style={styles.missionTitleRow}>
                        <Text style={styles.missionTitleText}>{mission.title}</Text>
                      </View>
                      <Text style={styles.missionSubtitleText}>{mission.subtitle}</Text>

                      {/* Progress Bar (if task in progress) */}
                      {mission.progress !== undefined && (
                        <View style={styles.missionProgressWrapper}>
                          <View style={styles.progressBarTrack}>
                            <View
                              style={[
                                styles.progressBarFill,
                                { width: `${mission.progress * 100}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.progressTextLabel}>
                            {mission.progressText}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Right: Reward Pill & Interactive Action Button */}
                  <View style={styles.missionRightCol}>
                    <View style={styles.rewardPill}>
                      <Text style={styles.rewardPillText}>{mission.reward}</Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={isClaimed ? 1 : 0.8}
                      onPress={() => handleMissionAction(mission)}
                      style={[
                        styles.missionActionBtn,
                        canClaim && styles.missionActionBtnClaim,
                        isClaimed && styles.missionActionBtnClaimed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.missionActionBtnText,
                          canClaim && styles.missionActionBtnTextClaim,
                          isClaimed && styles.missionActionBtnTextClaimed,
                        ]}
                      >
                        {isClaimed ? 'Claimed' : mission.actionLabel || mission.status}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* MODAL 1: REWARDS CLAIM HISTORY */}
        <Modal
          visible={showHistoryModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowHistoryModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleGroup}>
                  <View style={styles.modalIconCircle}>
                    <Ionicons name="receipt" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.modalTitle}>Rewards History</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseIconBtn}
                  onPress={() => setShowHistoryModal(false)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSectionLabel}>ALL-TIME DISTRIBUTION LEDGER</Text>

              <ScrollView style={styles.historyListScroll} showsVerticalScrollIndicator={false}>
                {historyItems.map((item) => (
                  <View key={item.id} style={styles.historyItemCard}>
                    <View style={styles.historyItemLeft}>
                      <Text style={styles.historyItemTitle}>{item.title}</Text>
                      <Text style={styles.historyItemDate}>{item.date}</Text>
                      <Text style={styles.historyItemHash}>Ref: {item.txHash}</Text>
                    </View>
                    <View style={styles.historyItemRight}>
                      <Text style={styles.historyItemAmount}>{item.amount}</Text>
                      <Text style={styles.historyItemFiat}>{item.fiatAmount}</Text>
                      <View style={styles.settledCheckPill}>
                        <View style={styles.settledGreenDot} />
                        <Text style={styles.settledCheckText}>Settled</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setShowHistoryModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL 2: VIP LOYALTY RULES & APY MULTIPLIERS */}
        <Modal
          visible={showRulesModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRulesModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleGroup}>
                  <View style={styles.modalIconCircle}>
                    <Ionicons name="trophy" size={18} color="#D97706" />
                  </View>
                  <Text style={styles.modalTitle}>VIP Rewards Multipliers</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseIconBtn}
                  onPress={() => setShowRulesModal(false)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSectionLabel}>LOYALTY TIERS & BONUSES</Text>

              <View style={styles.tierRulesList}>
                {[
                  { tier: 'VIP 1 (Bronze)', req: 'KYC Verified', bonus: '1.0x Base', active: false },
                  { tier: 'VIP 2 (Gold)', req: '₹ 25K+ Trading Vol', bonus: '1.5x Multiplier', active: true },
                  { tier: 'VIP 3 (Platinum)', req: '₹ 1 Lakh+ Vol', bonus: '2.0x Multiplier', active: false },
                  { tier: 'VIP Ambassador', req: '50+ Active Referrals', bonus: '2.5x Multiplier', active: false },
                ].map((tier, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tierRuleCard,
                      tier.active && styles.tierRuleCardActive,
                    ]}
                  >
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                          style={[
                            styles.tierRuleName,
                            tier.active && { color: Colors.primary },
                          ]}
                        >
                          {tier.tier}
                        </Text>
                        {tier.active && (
                          <View style={styles.currentTierCapsule}>
                            <Text style={styles.currentTierCapsuleText}>You Are Here</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.tierRuleReq}>{tier.req}</Text>
                    </View>
                    <Text
                      style={[
                        styles.tierRuleBonus,
                        tier.active && { color: '#05CD99' },
                      ]}
                    >
                      {tier.bonus}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setShowRulesModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Got It</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL 3: MYSTERY BOX CELEBRATION */}
        <Modal
          visible={showMysteryModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMysteryModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { alignItems: 'center' }]}>
              <View style={styles.mysteryCelebrationIconCircle}>
                <Ionicons name="sparkles" size={32} color="#F59E0B" />
              </View>

              <Text style={styles.mysteryCelebrationTitle}>🎉 Mystery Reward Unlocked!</Text>
              <Text style={styles.mysteryCelebrationSub}>
                Congratulations! You opened the Diamond Mystery Box.
              </Text>

              <View style={styles.mysteryPrizeCard}>
                <Text style={styles.mysteryPrizeAmount}>
                  +{mysteryRewardWon} xCoin
                </Text>
                <Text style={styles.mysteryPrizeFiat}>
                  ≈ ₹ {(mysteryRewardWon ? mysteryRewardWon * xCoinRate : 0).toFixed(2)} INR
                </Text>
              </View>

              <Text style={styles.mysteryPrizeNote}>
                Tokens have been credited to your Claimable Rewards pool.
              </Text>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setShowMysteryModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Awesome!</Text>
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
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F4F7FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1B2559',
    letterSpacing: -0.4,
  },
  tierLoyaltyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7.5,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tierLoyaltyPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
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

  /* MASTER REWARDS VAULT HERO CARD */
  vaultHeroCard: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    marginBottom: 16,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  vaultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  vaultTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  vaultIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
  },
  vaultHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  vaultHeaderSubtitle: {
    fontSize: 10.5,
    color: '#C4B5FD',
    fontWeight: '500',
    marginTop: 0.5,
  },
  zeroGasCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  zeroGasCapsuleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },

  vaultFiguresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vaultFiguresCol: {
    flex: 1,
    marginRight: 10,
  },
  tokenLabelEyeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vaultAmountLabel: {
    fontSize: 11,
    color: '#C4B5FD',
    fontWeight: '600',
  },
  compactEyeBtn: {
    padding: 2,
  },
  amountNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  vaultBalanceDigits: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  vaultBalanceCurrency: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E9D5FF',
    letterSpacing: -0.2,
  },
  vaultFiatEquivalent: {
    fontSize: 11.5,
    color: '#C4B5FD',
    fontWeight: '600',
    marginTop: 2,
  },
  claimAllHeroBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 92,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  claimAllHeroBtnDisabled: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    shadowOpacity: 0,
  },
  claimAllBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  claimAllBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  claimAllBtnSub: {
    color: '#D1FAE5',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },

  /* Ribbon */
  statsRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ribbonItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  ribbonIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 1,
  },
  ribbonLabel: {
    fontSize: 9.5,
    color: '#C4B5FD',
    fontWeight: '600',
  },
  ribbonVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  ribbonSub: {
    fontSize: 8.5,
    color: '#A78BFA',
    fontWeight: '600',
    marginTop: 0.5,
  },

  /* 7-DAY STREAK CARD */
  streakSectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    marginBottom: 14,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  streakSectionHeader: {
    marginBottom: 12,
  },
  streakTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B2559',
    letterSpacing: -0.2,
  },
  streakFlamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: '#FED7AA',
  },
  streakFlameText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
  },
  streakSubtitle: {
    fontSize: 11,
    color: '#707EAE',
    fontWeight: '500',
    marginTop: 2,
  },
  streakGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
  },
  streakDayBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 11,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  streakDayBoxClaimed: {
    backgroundColor: '#E6FAF5',
    borderColor: '#A7F3D0',
  },
  streakDayBoxToday: {
    backgroundColor: '#EEF2FF',
    borderColor: Colors.primary,
    borderWidth: 1.5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  streakDayBoxMega: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  streakDayTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#707EAE',
  },
  streakDayTitleClaimed: {
    color: '#05CD99',
  },
  streakDayTitleToday: {
    color: Colors.primary,
    fontWeight: '800',
  },
  streakIconCircle: {
    marginVertical: 4,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCoinValText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  streakBottomLabel: {
    fontSize: 8.5,
    color: '#707EAE',
    fontWeight: '600',
  },
  checkInPill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  checkInPillText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },

  /* MYSTERY LOOT BANNER */
  mysteryBoxBanner: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  mysteryLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  mysteryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  mysteryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mysteryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mysteryAvailablePill: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  mysteryAvailableText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  mysterySub: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  mysteryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 11,
  },
  mysteryActionBtnDone: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  mysteryActionBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },

  /* MISSIONS & QUESTS */
  missionsHeaderRow: {
    marginBottom: 10,
  },
  missionsSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B2559',
    letterSpacing: -0.2,
  },
  missionsSectionSubtitle: {
    fontSize: 11,
    color: '#707EAE',
    fontWeight: '500',
    marginTop: 1,
  },
  missionTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  missionTabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#E8EDF8',
  },
  missionTabBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  missionTabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#707EAE',
  },
  missionTabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  missionsList: {
    gap: 10,
  },
  missionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  missionLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  missionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionInfoCol: {
    flex: 1,
  },
  missionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  missionTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
  },
  missionSubtitleText: {
    fontSize: 10.5,
    color: '#707EAE',
    fontWeight: '500',
    marginTop: 1,
  },
  missionProgressWrapper: {
    marginTop: 5,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EEF2F6',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  progressTextLabel: {
    fontSize: 9,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 2,
  },
  missionRightCol: {
    alignItems: 'flex-end',
    gap: 5,
  },
  rewardPill: {
    backgroundColor: '#E6FAF5',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: '#A7F3D0',
  },
  rewardPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#05CD99',
  },
  missionActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: '#F4F7FE',
  },
  missionActionBtnClaim: {
    backgroundColor: Colors.primary,
  },
  missionActionBtnClaimed: {
    backgroundColor: '#E6FAF5',
  },
  missionActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#707EAE',
  },
  missionActionBtnTextClaim: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  missionActionBtnTextClaimed: {
    color: '#05CD99',
    fontWeight: '800',
  },

  /* MODALS */
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
  modalCloseIconBtn: {
    padding: 4,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  historyListScroll: {
    maxHeight: 280,
    marginBottom: 14,
  },
  historyItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyItemLeft: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  historyItemDate: {
    fontSize: 10.5,
    color: '#707EAE',
    fontWeight: '500',
    marginTop: 1,
  },
  historyItemHash: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },
  historyItemRight: {
    alignItems: 'flex-end',
  },
  historyItemAmount: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#05CD99',
  },
  historyItemFiat: {
    fontSize: 10.5,
    color: '#707EAE',
    fontWeight: '600',
  },
  settledCheckPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E6FAF5',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 2,
  },
  settledGreenDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#05CD99',
  },
  settledCheckText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#05CD99',
  },

  /* Tier Rules */
  tierRulesList: {
    gap: 8,
    marginBottom: 16,
  },
  tierRuleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tierRuleCardActive: {
    backgroundColor: '#EEF2FF',
    borderColor: Colors.primary,
  },
  tierRuleName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  currentTierCapsule: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  currentTierCapsuleText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  tierRuleReq: {
    fontSize: 10,
    color: '#707EAE',
    fontWeight: '500',
    marginTop: 1,
  },
  tierRuleBonus: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#707EAE',
  },

  /* Mystery Celebration */
  mysteryCelebrationIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mysteryCelebrationTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1B2559',
    textAlign: 'center',
  },
  mysteryCelebrationSub: {
    fontSize: 12,
    color: '#707EAE',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 14,
  },
  mysteryPrizeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    width: '100%',
  },
  mysteryPrizeAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#05CD99',
  },
  mysteryPrizeFiat: {
    fontSize: 12,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 2,
  },
  mysteryPrizeNote: {
    fontSize: 11,
    color: '#707EAE',
    textAlign: 'center',
    marginBottom: 16,
  },

  modalDoneBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
