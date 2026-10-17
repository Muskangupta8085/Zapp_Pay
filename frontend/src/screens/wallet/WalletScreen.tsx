import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { HomeService } from '../../services/api.service';

interface WalletScreenProps {
  onBack?: () => void;
  onNavigateToBuy?: () => void;
  onNavigateToSell?: () => void;
  onNavigateToRequest?: () => void;
  onNavigateToOrders?: () => void;
}

type AssetFilter = 'All' | 'Native' | 'Crypto' | 'Stable';

export const WalletScreen: React.FC<WalletScreenProps> = ({
  onBack,
  onNavigateToBuy,
  onNavigateToSell,
  onNavigateToRequest,
  onNavigateToOrders,
}) => {
  const { user, wallet, xCoinBalance, usdtBalance, refreshWallet } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [activeFilter, setActiveFilter] = useState<AssetFilter>('All');
  const [rates, setRates] = useState({ xCoin: 108.37, usdt: 87.42 });

  React.useEffect(() => {
    refreshWallet();
    const fetchRates = async () => {
      try {
        const tickers = await HomeService.getTickers();
        if (Array.isArray(tickers)) {
          const zap = tickers.find((t: any) => t.id === 'xcoin')?.rawPrice;
          const usdt = tickers.find((t: any) => t.id === 'usdt')?.rawPrice;
          setRates((prev) => ({
            xCoin: zap || prev.xCoin,
            usdt: usdt || prev.usdt,
          }));
        }
      } catch {
        // Keep fallback
      }
    };
    fetchRates();
  }, []);

  const walletAddress = user?.walletAddress || wallet?.walletAddress || 'Generating Vault Address...';

  const xCoinFiat = xCoinBalance * rates.xCoin;
  const usdtFiat = usdtBalance * rates.usdt;
  const totalPortfolioFiat = xCoinFiat + usdtFiat;

  const assets = [
    {
      id: 'xcoin',
      symbol: 'xCoin',
      name: 'Zapp Pay Native Token',
      balance: `${xCoinBalance.toFixed(2)} xCoin`,
      fiat: `₹ ${xCoinFiat.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      allocation: totalPortfolioFiat > 0 ? `${((xCoinFiat / totalPortfolioFiat) * 100).toFixed(1)}%` : '100%',
      isNative: true,
      change: '+14.28%',
      isPositive: true,
      category: 'Native' as const,
      color: Colors.primary,
    },
    {
      id: 'usdt',
      symbol: 'USDT',
      name: 'Tether USD',
      balance: `${usdtBalance.toFixed(2)} USDT`,
      fiat: `₹ ${usdtFiat.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      allocation: totalPortfolioFiat > 0 ? `${((usdtFiat / totalPortfolioFiat) * 100).toFixed(1)}%` : '0%',
      glyph: '₮',
      badgeColor: '#10B981',
      change: '+0.05%',
      isPositive: true,
      category: 'Stable' as const,
      color: '#10B981',
    },
  ];

  const filteredAssets = assets.filter((asset) => {
    if (activeFilter === 'All') return true;
    return asset.category === activeFilter;
  });

  const handleCopyAddress = () => {
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleAssetPress = (asset: (typeof assets)[0]) => {
    Alert.alert(
      `${asset.name} (${asset.symbol})`,
      `Balance: ${asset.balance}\nValuation: ${asset.fiat}\n24h Performance: ${asset.change}`,
      [
        {
          text: `Buy ${asset.symbol}`,
          onPress: () => onNavigateToBuy && onNavigateToBuy(),
        },
        {
          text: `Sell ${asset.symbol}`,
          onPress: () => onNavigateToSell && onNavigateToSell(),
        },
        { text: 'Close', style: 'cancel' },
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
        {/* Sleek Top Header (Aligned with Buy & Sell screens) */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={19} color="#1B2559" />
          </TouchableOpacity>

          <View style={styles.headerTitleCenter}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>My Web3 Wallet</Text>
              <View style={styles.coldVaultHeaderBadge}>
                <Ionicons name="shield-checkmark" size={10} color="#05CD99" />
                <Text style={styles.coldVaultHeaderText}>Cold Storage</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Multi-Chain Vault • 256-Bit Escrow Security
            </Text>
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
          {/* PERFECTLY PROPORTIONED VAULT HERO CARD (~185px) */}
          <LinearGradient
            colors={['#0B0920', '#140E3A', '#1E105C', '#3914D8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vaultHeroCard}
          >
            {/* Top Row: Label + Eye + Security Pill */}
            <View style={styles.vaultTopRow}>
              <View style={styles.vaultLabelRow}>
                <Text style={styles.vaultLabel}>NET PORTFOLIO VALUE</Text>
                <TouchableOpacity
                  onPress={() => setHideBalance(!hideBalance)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={hideBalance ? 'eye-off-outline' : 'eye-outline'}
                    size={13}
                    color="#C7D2FE"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.coldPill}>
                <View style={styles.coldDot} />
                <Text style={styles.coldText}>Multi-Sig Vault</Text>
              </View>
            </View>

            {/* Main Balance Cluster */}
            <View style={styles.balanceCluster}>
              <Text style={styles.vaultMainBalance}>
                {hideBalance ? '••••••••' : `₹ ${totalPortfolioFiat.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </Text>
              <View style={styles.fiatRow}>
                <Text style={styles.vaultSubFiat}>
                  {hideBalance ? '••••' : `≈ $${(totalPortfolioFiat / 83.5).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`}
                </Text>
                <View style={styles.growthBadge}>
                  <Ionicons name="trending-up" size={11} color="#05CD99" />
                  <Text style={styles.growthText}>+8.45% today</Text>
                </View>
              </View>
            </View>

            {/* 4 Sleek Action Hubs: Deposit, Withdraw, Send, History */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={onNavigateToBuy}
                activeOpacity={0.75}
              >
                <View style={[styles.actionCircle, styles.actionCircleDeposit]}>
                  <Ionicons name="arrow-down-circle" size={19} color="#05CD99" />
                </View>
                <Text style={styles.actionLabel}>Deposit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={onNavigateToSell}
                activeOpacity={0.75}
              >
                <View style={[styles.actionCircle, styles.actionCircleWithdraw]}>
                  <Ionicons name="arrow-up-circle" size={19} color="#EE5D50" />
                </View>
                <Text style={styles.actionLabel}>Withdraw</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() =>
                  Alert.alert(
                    'Instant Transfer',
                    'Direct zero-fee transfer to any Zapp Pay user or external Web3 address.'
                  )
                }
                activeOpacity={0.75}
              >
                <View style={[styles.actionCircle, styles.actionCircleTransfer]}>
                  <Ionicons name="paper-plane" size={17} color="#FFB547" />
                </View>
                <Text style={styles.actionLabel}>Transfer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={onNavigateToRequest}
                activeOpacity={0.75}
              >
                <View style={[styles.actionCircle, styles.actionCircleRequest]}>
                  <Ionicons name="arrow-down-outline" size={17} color="#38BDF8" />
                </View>
                <Text style={styles.actionLabel}>Request</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={onNavigateToOrders}
                activeOpacity={0.75}
              >
                <View style={[styles.actionCircle, styles.actionCircleHistory]}>
                  <Ionicons name="receipt" size={17} color="#93C5FD" />
                </View>
                <Text style={styles.actionLabel}>History</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* SLENDER WEB3 DEPOSIT ADDRESS ROW */}
          <View style={styles.addressPillCard}>
            <View style={styles.addressLeft}>
              <View style={styles.networkDot} />
              <View>
                <Text style={styles.addressLabel}>ZAPP PAY / WEB3 RECV ADDRESS</Text>
                <Text style={styles.addressHash} numberOfLines={1}>
                  {walletAddress}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.copyBtn, copiedAddress && styles.copyBtnActive]}
              onPress={handleCopyAddress}
              activeOpacity={0.75}
            >
              <Ionicons
                name={copiedAddress ? 'checkmark' : 'copy-outline'}
                size={13}
                color={copiedAddress ? '#05CD99' : Colors.primary}
              />
              <Text
                style={[
                  styles.copyBtnText,
                  copiedAddress && { color: '#05CD99' },
                ]}
              >
                {copiedAddress ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* PORTFOLIO ASSET ALLOCATION SPARK-BAR (Institutional Touch) */}
          <View style={styles.allocationCard}>
            <View style={styles.allocationCardHeader}>
              <Text style={styles.allocationCardTitle}>ASSET ALLOCATION</Text>
              <Text style={styles.allocationCountText}>
                {assets.length} Active Holdings
              </Text>
            </View>

            {/* Multi-Colored Segmented Bar */}
            <View style={styles.allocationBarContainer}>
              <View style={[styles.barSegment, { flex: 82.5, backgroundColor: Colors.primary }]} />
              <View style={[styles.barSegment, { flex: 17.5, backgroundColor: '#10B981' }]} />
            </View>

            {/* Mini Legend Row */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.legendText}>xCoin 82.5%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>USDT 17.5%</Text>
              </View>
            </View>
          </View>

          {/* ASSET FILTER PILLS */}
          <View style={styles.filterRow}>
            {(['All', 'Native', 'Stable'] as const).map((filter) => {
              const isSelected = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    isSelected && styles.filterChipActive,
                  ]}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextActive,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* HIGH-DEFINITION HOLDINGS LIST */}
          <View style={styles.assetsListCard}>
            {filteredAssets.map((asset, index) => (
              <TouchableOpacity
                key={asset.id}
                style={[
                  styles.assetItemRow,
                  index === filteredAssets.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => handleAssetPress(asset)}
                activeOpacity={0.7}
              >
                <View style={styles.assetLeft}>
                  {asset.isNative ? (
                    <View style={styles.nativeBadge}>
                      <Image
                        source={require('../../../assets/images/logo_transparent.png')}
                        style={styles.nativeBadgeImg}
                        resizeMode="contain"
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.cryptoBadge,
                        { backgroundColor: asset.badgeColor },
                      ]}
                    >
                      <Text style={styles.cryptoGlyph}>
                        {asset.glyph}
                      </Text>
                    </View>
                  )}

                  <View>
                    <View style={styles.symbolRow}>
                      <Text style={styles.assetSymbolText}>{asset.symbol}</Text>
                      <View
                        style={[
                          styles.changePill,
                          {
                            backgroundColor: asset.isPositive
                              ? 'rgba(5, 205, 153, 0.12)'
                              : 'rgba(238, 93, 80, 0.12)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.changeText,
                            { color: asset.isPositive ? '#05CD99' : '#EE5D50' },
                          ]}
                        >
                          {asset.change}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.assetNameText}>{asset.name}</Text>
                  </View>
                </View>

                <View style={styles.assetRight}>
                  <Text style={styles.assetFiatText}>
                    {hideBalance ? '••••' : asset.fiat}
                  </Text>
                  <Text style={styles.assetCoinsText}>
                    {hideBalance ? '••••' : asset.balance}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* REGULATORY & COLD STORAGE FOOTER */}
          <View style={styles.securityBanner}>
            <View style={styles.securityIconCircle}>
              <Ionicons name="shield-checkmark" size={17} color="#05CD99" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.securityTitle}>
                Bank-Grade 256-Bit Cold Storage Vault
              </Text>
              <Text style={styles.securitySub}>
                100% segregated asset reserves • Insured multi-signature custody • FIU-IND compliant
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

  // Top Header (Identical to Buy & Sell screens)
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(238, 242, 246, 0.85)',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
  },
  headerTitleCenter: {
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1B2559',
  },
  coldVaultHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(5, 205, 153, 0.14)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coldVaultHeaderText: {
    color: '#05CD99',
    fontSize: 9.5,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 10.5,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 1,
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
  },
  headerLogoImage: {
    width: 24,
    height: 24,
  },

  scrollContent: {
    padding: 14,
    paddingBottom: 36,
  },

  // PERFECTLY PROPORTIONED VAULT HERO CARD (~185px)
  vaultHeroCard: {
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#4318FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  vaultTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  vaultLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vaultLabel: {
    color: '#C7D2FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  eyeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  coldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 205, 153, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  coldDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#05CD99',
  },
  coldText: {
    color: '#05CD99',
    fontSize: 9.5,
    fontWeight: '800',
  },

  // Balance Cluster
  balanceCluster: {
    marginBottom: 12,
  },
  vaultMainBalance: {
    fontSize: 27,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  fiatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 2,
  },
  vaultSubFiat: {
    fontSize: 11.5,
    color: '#C7D2FE',
    fontWeight: '600',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    backgroundColor: 'rgba(5, 205, 153, 0.2)',
    paddingHorizontal: 5.5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  growthText: {
    color: '#05CD99',
    fontSize: 9.5,
    fontWeight: '800',
  },

  // 4 Action Shortcuts
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
  },
  actionCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionCircleDeposit: {
    backgroundColor: 'rgba(5, 205, 153, 0.22)',
  },
  actionCircleWithdraw: {
    backgroundColor: 'rgba(238, 93, 80, 0.22)',
  },
  actionCircleTransfer: {
    backgroundColor: 'rgba(255, 181, 71, 0.22)',
  },
  actionCircleRequest: {
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
  },
  actionCircleHistory: {
    backgroundColor: 'rgba(147, 197, 253, 0.22)',
  },
  actionLabel: {
    color: '#F1F5F9',
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 4,
  },

  // SLENDER DEPOSIT ADDRESS ROW
  addressPillCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    marginBottom: 10,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#05CD99',
  },
  addressLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.5,
  },
  addressHash: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1B2559',
    marginTop: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  copyBtnActive: {
    backgroundColor: '#E6FAF5',
    borderColor: '#A7F3D0',
  },
  copyBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: Colors.primary,
  },

  // PORTFOLIO ALLOCATION SPARK-BAR
  allocationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    marginBottom: 10,
  },
  allocationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  allocationCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.6,
  },
  allocationCountText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
  },
  allocationBarContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginBottom: 8,
    gap: 2,
  },
  barSegment: {
    height: '100%',
    borderRadius: 1.5,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 9.5,
    color: '#707EAE',
    fontWeight: '700',
  },

  // FILTER CHIPS
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#E8EDF8',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#707EAE',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // HOLDINGS LIST
  assetsListCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 12,
  },
  assetItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  assetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nativeBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
  },
  nativeBadgeImg: {
    width: 22,
    height: 22,
  },
  cryptoBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cryptoGlyph: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  assetSymbolText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#1B2559',
  },
  changePill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  changeText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  assetNameText: {
    fontSize: 10,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 0.5,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetFiatText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#1B2559',
  },
  assetCoinsText: {
    fontSize: 10,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 1,
  },

  // SECURITY FOOTER
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: '#E8EDF8',
  },
  securityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E6FAF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  securitySub: {
    fontSize: 9.5,
    color: '#707EAE',
    marginTop: 1.5,
    lineHeight: 13,
  },
});
