import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { HomeService } from '../../services/api.service';
import { apiClient } from '../../api/client';

interface SellScreenProps {
  onBack?: () => void;
  onNavigateToOrders?: () => void;
}

type PayoutMode = 'INR' | 'USDT';

interface HoldingAsset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  inrPrice: number;
  usdtPrice: number;
  change: string;
  isPositive: boolean;
  isNative?: boolean;
  glyph?: string;
  badgeColor?: string;
}

export const SellScreen: React.FC<SellScreenProps> = ({
  onBack,
  onNavigateToOrders,
}) => {
  const { user, xCoinBalance, usdtBalance, refreshWallet } = useAuth();
  const [payoutMode, setPayoutMode] = useState<PayoutMode>('INR');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('xcoin');
  const [sellAmount, setSellAmount] = useState<string>('200');
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);
  const [rates, setRates] = useState({ xCoin: 108.37, usdt: 87.42 });

  useEffect(() => {
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
        // Fallback
      }
    };
    fetchRates();
  }, []);

  // Multi-asset user portfolio holdings
  const holdings: HoldingAsset[] = [
    {
      id: 'xcoin',
      symbol: 'xCoin',
      name: 'Zapp Pay Native',
      balance: xCoinBalance,
      inrPrice: rates.xCoin,
      usdtPrice: Number((rates.xCoin / rates.usdt).toFixed(2)) || 1.24,
      change: '+14.28%',
      isPositive: true,
      isNative: true,
    },
    {
      id: 'usdt',
      symbol: 'USDT',
      name: 'Tether USD',
      balance: usdtBalance,
      inrPrice: rates.usdt,
      usdtPrice: 1.0,
      change: '+0.05%',
      isPositive: true,
      glyph: '₮',
      badgeColor: '#10B981',
    },
  ];

  // In USDT payout mode, filter out USDT itself from being sold into USDT
  const displayHoldings =
    payoutMode === 'USDT'
      ? holdings.filter((h) => h.id !== 'usdt')
      : holdings;

  const currentAsset =
    displayHoldings.find((h) => h.id === selectedAssetId) || displayHoldings[0];

  // When switching payout mode, ensure selected asset is valid
  useEffect(() => {
    if (payoutMode === 'USDT' && selectedAssetId === 'usdt') {
      setSelectedAssetId('xcoin');
    }
  }, [payoutMode]);

  // Set default sell amount when asset changes
  useEffect(() => {
    setSelectedPercentage(null);
    if (currentAsset.id === 'usdt') {
      setSellAmount('100');
    } else {
      setSellAmount('200');
    }
  }, [currentAsset.id]);

  const numSellAmount = parseFloat(sellAmount) || 0;
  const currentPrice =
    payoutMode === 'INR' ? currentAsset.inrPrice : currentAsset.usdtPrice;

  const grossPayout = numSellAmount * currentPrice;
  // 1% TDS applies for INR bank liquidations under Indian tax law; 0% TDS for USDT crypto-crypto swap
  const tdsDeduction = payoutMode === 'INR' ? grossPayout * 0.01 : 0;
  const netPayout = Math.max(0, grossPayout - tdsDeduction);

  const handlePercentageSelect = (pct: number) => {
    setSelectedPercentage(pct);
    const calculated = (currentAsset.balance * pct).toFixed(2);
    setSellAmount(calculated);
  };

  const handleSellSubmit = async () => {
    if (numSellAmount <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid amount to sell.');
      return;
    }
    if (numSellAmount > currentAsset.balance) {
      Alert.alert(
        'Insufficient Balance',
        `You have ${currentAsset.balance} ${currentAsset.symbol} available.`
      );
      return;
    }

    const bankDisplayName = user?.bankAccount?.bankName || 'Primary Bank Account';
    const bankDisplayAcc = user?.bankAccount?.accountNumber ? `•••• ${user.bankAccount.accountNumber.slice(-4)}` : '•••• 4892';

    try {
      const res = await apiClient.post('/orders/sell', {
        assetSymbol: currentAsset.symbol === 'xCoin' ? 'ZAP' : currentAsset.symbol,
        sellAmount: numSellAmount,
        payoutMode,
      });

      if (res.data?.success) {
        await refreshWallet();
        if (payoutMode === 'INR') {
          Alert.alert(
            'Sell Order Executed! 🚀',
            `Sold ${numSellAmount} ${currentAsset.symbol}.\n\nNet payout of ₹ ${res.data.data?.netPayout || netPayout.toLocaleString(
              'en-IN',
              { maximumFractionDigits: 2 }
            )} has been dispatched via IMPS to your ${bankDisplayName} (${bankDisplayAcc}).\n\n1% TDS certificate will be generated automatically.`,
            [
              {
                text: 'View Orders',
                onPress: () => onNavigateToOrders && onNavigateToOrders(),
              },
              { text: 'Done', style: 'cancel' },
            ]
          );
        } else {
          Alert.alert(
            'Swap to USDT Completed! 💎',
            `Swapped ${numSellAmount} ${currentAsset.symbol} for ${res.data.data?.netPayout || netPayout.toLocaleString(
              'en-US',
              { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            )} USDT.\n\nFunds credited directly to your Spot USDT Vault with 0 TDS.`,
            [
              {
                text: 'View Orders',
                onPress: () => onNavigateToOrders && onNavigateToOrders(),
              },
              { text: 'Done', style: 'cancel' },
            ]
          );
        }
      }
    } catch (err: any) {
      Alert.alert('Sell Failed', err.message || 'Failed to execute sell order.');
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/onboarding_bg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* Sleek Top Header (Exact matching theme with BuyScreen) */}
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
              <Text style={styles.headerTitle}>Sell Crypto</Text>
              <View style={styles.instantHeaderBadge}>
                <Ionicons name="flash" size={10} color="#05CD99" />
                <Text style={styles.instantHeaderText}>Instant IMPS</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Direct Bank Settlement • 100% Tax Compliant
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
          {/* COMPACT PAYOUT DESTINATION SWITCHER (Bank vs USDT) */}
          <View style={styles.payoutToggleContainer}>
            <TouchableOpacity
              style={[
                styles.payoutToggleBtn,
                payoutMode === 'INR' && styles.payoutToggleBtnActive,
              ]}
              onPress={() => setPayoutMode('INR')}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.payoutFlagBadge,
                  payoutMode === 'INR' && styles.payoutFlagBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.payoutFlagText,
                    payoutMode === 'INR' && styles.payoutFlagTextActive,
                  ]}
                >
                  ₹
                </Text>
              </View>
              <View style={styles.toggleTextCol}>
                <Text
                  style={[
                    styles.payoutToggleTitle,
                    payoutMode === 'INR' && styles.payoutToggleTitleActive,
                  ]}
                >
                  Withdraw to Bank
                </Text>
                <Text style={styles.payoutToggleSubtitle}>
                  Instant IMPS (INR)
                </Text>
              </View>
              {payoutMode === 'INR' && (
                <View style={styles.activeCheckDot}>
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.payoutToggleBtn,
                payoutMode === 'USDT' && styles.payoutToggleBtnActive,
              ]}
              onPress={() => setPayoutMode('USDT')}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.payoutFlagBadge,
                  styles.payoutFlagBadgeUsdt,
                  payoutMode === 'USDT' && styles.payoutFlagBadgeActiveUsdt,
                ]}
              >
                <Text
                  style={[
                    styles.payoutFlagTextUsdt,
                    payoutMode === 'USDT' && styles.payoutFlagTextActiveUsdt,
                  ]}
                >
                  ₮
                </Text>
              </View>
              <View style={styles.toggleTextCol}>
                <Text
                  style={[
                    styles.payoutToggleTitle,
                    payoutMode === 'USDT' && styles.payoutToggleTitleActive,
                  ]}
                >
                  Swap to USDT
                </Text>
                <Text style={styles.payoutToggleSubtitle}>
                  Spot Vault (0% TDS)
                </Text>
              </View>
              {payoutMode === 'USDT' && (
                <View style={[styles.activeCheckDot, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* SELECT ASSET TO SELL (SLEEK, COMPACT HORIZONTAL CARDS) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>
              SELECT ASSET FROM PORTFOLIO ({displayHoldings.length})
            </Text>
            <View style={styles.portfolioHoldingsTag}>
              <Ionicons name="wallet-outline" size={11} color="#4318FF" />
              <Text style={styles.portfolioHoldingsText}>Available Assets</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.assetsScroll}
          >
            {displayHoldings.map((asset) => {
              const isSelected = selectedAssetId === asset.id;
              const holdingValue =
                payoutMode === 'INR'
                  ? `₹ ${(asset.balance * asset.inrPrice).toLocaleString('en-IN', {
                      maximumFractionDigits: 0,
                    })}`
                  : `${(asset.balance * asset.usdtPrice).toFixed(1)} ₮`;

              return (
                <TouchableOpacity
                  key={asset.id}
                  style={[
                    styles.assetCard,
                    isSelected && styles.assetCardActive,
                  ]}
                  onPress={() => setSelectedAssetId(asset.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.assetCardTop}>
                    {asset.isNative ? (
                      <View style={styles.miniLogoBadge}>
                        <Image
                          source={require('../../../assets/images/logo_transparent.png')}
                          style={styles.miniLogoImg}
                          resizeMode="contain"
                        />
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.glyphBadge,
                          {
                            backgroundColor:
                              asset.badgeColor || Colors.primary,
                          },
                        ]}
                      >
                        <Text style={styles.glyphText}>
                          {asset.glyph || asset.symbol[0]}
                        </Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.changeTag,
                        {
                          backgroundColor: asset.isPositive
                            ? 'rgba(5, 205, 153, 0.12)'
                            : 'rgba(238, 93, 80, 0.12)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.assetChangeText,
                          {
                            color: asset.isPositive ? '#05CD99' : '#EE5D50',
                          },
                        ]}
                      >
                        {asset.change}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.assetSymbol}>{asset.symbol}</Text>
                  <Text style={styles.assetBalanceText}>
                    {asset.balance} {asset.symbol}
                  </Text>
                  <Text style={styles.assetHoldingValue}>{holdingValue}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* STREAMLINED & BALANCED LIQUIDATION CONVERTER CARD (Matching BuyScreen Cosmic Palette) */}
          <LinearGradient
            colors={['#0B0920', '#140E3A', '#1E105C', '#3914D8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.converterCard}
          >
            {/* YOU SELL SECTION */}
            <View style={styles.converterSection}>
              <View style={styles.converterSectionHeader}>
                <Text style={styles.converterSectionLabel}>YOU SELL</Text>
                <Text style={styles.availableBalanceHint}>
                  Avail: {currentAsset.balance} {currentAsset.symbol}
                </Text>
              </View>

              <View style={styles.converterInputRow}>
                <View style={styles.assetPillBadge}>
                  {currentAsset.isNative ? (
                    <Image
                      source={require('../../../assets/images/logo_transparent.png')}
                      style={styles.pillMiniLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.pillGlyph}>
                      {currentAsset.glyph || currentAsset.symbol[0]}
                    </Text>
                  )}
                  <Text style={styles.assetPillSymbol}>
                    {currentAsset.symbol}
                  </Text>
                </View>

                <TextInput
                  style={styles.converterInput}
                  keyboardType="numeric"
                  value={sellAmount}
                  onChangeText={(val) => {
                    setSellAmount(val);
                    setSelectedPercentage(null);
                  }}
                  placeholder="0"
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
                />
              </View>

              {/* Quick Percentage Chips Row */}
              <View style={styles.quickChipsRow}>
                {[
                  { label: '25%', val: 0.25 },
                  { label: '50%', val: 0.5 },
                  { label: '75%', val: 0.75 },
                  { label: 'MAX', val: 1.0 },
                ].map((chip) => {
                  const isActive = selectedPercentage === chip.val;
                  return (
                    <TouchableOpacity
                      key={chip.label}
                      style={[
                        styles.quickChip,
                        isActive && styles.quickChipActive,
                      ]}
                      onPress={() => handlePercentageSelect(chip.val)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.quickChipText,
                          isActive && styles.quickChipTextActive,
                        ]}
                      >
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SLEEK CONVERSION BRIDGE DIVIDER */}
            <View style={styles.bridgeRow}>
              <View style={styles.bridgeLine} />
              <View style={styles.bridgeRateBadge}>
                <Ionicons name="swap-vertical" size={13} color="#A5B4FC" />
                <Text style={styles.bridgeRateText}>
                  1 {currentAsset.symbol} ={' '}
                  {payoutMode === 'INR'
                    ? `₹${currentAsset.inrPrice.toLocaleString('en-IN')}`
                    : `${currentAsset.usdtPrice.toLocaleString('en-US')} USDT`}
                </Text>
              </View>
              <View style={styles.bridgeLine} />
            </View>

            {/* YOU RECEIVE (NET PAYOUT) SECTION */}
            <View style={styles.converterSection}>
              <View style={styles.converterSectionHeader}>
                <Text style={styles.converterReceiveLabel}>
                  NET PAYOUT {payoutMode === 'INR' ? '(TO BANK)' : '(TO VAULT)'}
                </Text>
                <View style={styles.instantPayoutPill}>
                  <Ionicons name="shield-checkmark" size={10} color="#05CD99" />
                  <Text style={styles.instantPayoutText}>
                    {payoutMode === 'INR' ? 'IMPS Dispatched' : 'Zero TDS'}
                  </Text>
                </View>
              </View>

              <View style={styles.receiveOutputRow}>
                <View style={styles.receiveDestBadge}>
                  <Text style={styles.receiveDestSymbol}>
                    {payoutMode === 'INR' ? '₹' : '₮'}
                  </Text>
                  <Text style={styles.receiveDestName}>
                    {payoutMode === 'INR' ? 'INR (Bank)' : 'USDT Vault'}
                  </Text>
                </View>

                <Text style={styles.receiveOutputValue}>
                  {payoutMode === 'INR'
                    ? `₹ ${netPayout > 0 ? netPayout.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0.00'}`
                    : `${netPayout > 0 ? netPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} ₮`}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* VERIFIED PAYOUT DESTINATION */}
          <Text style={styles.sectionLabel}>
            {payoutMode === 'INR'
              ? 'RECEIVING BANK ACCOUNT'
              : 'DESTINATION VAULT'}
          </Text>

          {payoutMode === 'INR' ? (
            <View style={styles.bankCard}>
              <View style={styles.bankIconCircle}>
                <Ionicons name="business" size={18} color="#4318FF" />
              </View>
              <View style={styles.bankInfoCol}>
                <View style={styles.bankTitleRow}>
                  <Text style={styles.bankName}>{user?.bankAccount?.bankName || 'Settlement Bank Account'}</Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={11}
                      color="#05CD99"
                    />
                    <Text style={styles.verifiedText}>Verified Payout</Text>
                  </View>
                </View>
                <Text style={styles.bankAccountNo}>
                  Account: •••••••• {user?.bankAccount?.accountNumber ? user.bankAccount.accountNumber.slice(-4) : (user?.phone ? user.phone.slice(-4) : '4892')} ({user?.fullName ? user.fullName.split(' ')[0] : 'Trader'})
                </Text>
                <Text style={styles.ifscCode}>
                  {user?.bankAccount?.ifsc ? `IFSC: ${user.bankAccount.ifsc} • IMPS Fast Channel` : 'Verified IMPS Fast Settlement Channel'}
                </Text>
              </View>
              <View style={styles.bankActiveDot}>
                <View style={styles.bankActiveDotInner} />
              </View>
            </View>
          ) : (
            <View style={styles.bankCard}>
              <View
                style={[
                  styles.bankIconCircle,
                  { backgroundColor: '#ECFDF5' },
                ]}
              >
                <Ionicons name="shield-checkmark" size={18} color="#10B981" />
              </View>
              <View style={styles.bankInfoCol}>
                <View style={styles.bankTitleRow}>
                  <Text style={styles.bankName}>Spot USDT Vault</Text>
                  <View
                    style={[
                      styles.verifiedBadge,
                      { backgroundColor: '#EFF6FF' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.verifiedText,
                        { color: Colors.primary },
                      ]}
                    >
                      Zero TDS
                    </Text>
                  </View>
                </View>
                <Text style={styles.bankAccountNo}>
                  Internal Cold Vault • {usdtBalance.toFixed(2)} USDT Balance
                </Text>
                <Text style={styles.ifscCode}>
                  Instant Credit • 0 Gas Fee Transfer
                </Text>
              </View>
              <View
                style={[
                  styles.bankActiveDot,
                  { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                ]}
              >
                <View
                  style={[
                    styles.bankActiveDotInner,
                    { backgroundColor: '#10B981' },
                  ]}
                />
              </View>
            </View>
          )}

          {/* COMPACT & REGULATORY BREAKDOWN CARD */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Gross Liquidation Value</Text>
              <Text style={styles.summaryValue}>
                {payoutMode === 'INR'
                  ? `₹ ${grossPayout > 0 ? grossPayout.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0.00'}`
                  : `${grossPayout > 0 ? grossPayout.toFixed(2) : '0.00'} USDT`}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform Withdrawal Fee</Text>
              <Text style={[styles.summaryValue, { color: '#05CD99' }]}>
                ₹ 0.00 (Zero Fee Promo)
              </Text>
            </View>

            {payoutMode === 'INR' ? (
              <View style={styles.summaryRow}>
                <View style={styles.tdsLabelRow}>
                  <Text style={styles.summaryLabel}>Govt TDS (1% Sec 194S)</Text>
                  <Ionicons
                    name="information-circle-outline"
                    size={13}
                    color="#707EAE"
                  />
                </View>
                <Text style={[styles.summaryValue, { color: '#EE5D50' }]}>
                  - ₹{' '}
                  {tdsDeduction > 0
                    ? tdsDeduction.toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })
                    : '0.00'}
                </Text>
              </View>
            ) : (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Crypto Swap TDS</Text>
                <Text style={[styles.summaryValue, { color: '#05CD99' }]}>
                  0% Exempt (Spot Vault)
                </Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Transfer Settlement Speed</Text>
              <Text style={[styles.summaryValue, { color: '#05CD99' }]}>
                {payoutMode === 'INR' ? 'Instant IMPS (< 30s)' : 'Instant (< 5s)'}
              </Text>
            </View>

            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>
                {payoutMode === 'INR'
                  ? 'Net Amount Dispatched to Bank'
                  : 'Net Credited to Vault'}
              </Text>
              <Text style={styles.summaryTotalValue}>
                {payoutMode === 'INR'
                  ? `₹ ${netPayout > 0 ? netPayout.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0.00'}`
                  : `${netPayout > 0 ? netPayout.toFixed(2) : '0.00'} USDT`}
              </Text>
            </View>
          </View>

          {/* PRIMARY SELL / LIQUIDATE BUTTON (Using BuyScreen Royal Gradient Theme) */}
          <TouchableOpacity
            style={styles.submitSellBtn}
            onPress={handleSellSubmit}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#4318FF', '#3110C6', '#1A0D6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitSellGradient}
            >
              <Ionicons name="arrow-up-circle" size={19} color="#FFFFFF" />
              <Text style={styles.submitSellBtnText}>
                {payoutMode === 'INR'
                  ? `Liquidate & Withdraw to Bank`
                  : `Swap ${currentAsset.symbol} to USDT`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Regulatory Security Footer */}
          <View style={styles.securityFooter}>
            <Ionicons name="shield-checkmark" size={13} color="#05CD99" />
            <Text style={styles.securityFooterText}>
              FIU-IND Registered • Form 26AS TDS Certificate Provided
            </Text>
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

  // Top Header (Identical to BuyScreen)
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
  instantHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(5, 205, 153, 0.14)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  instantHeaderText: {
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

  // COMPACT PAYOUT DESTINATION TOGGLE (Same Royal Theme as BuyScreen)
  payoutToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    marginBottom: 10,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 6,
  },
  payoutToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  payoutToggleBtnActive: {
    backgroundColor: '#F5F8FF',
    borderColor: Colors.primary,
  },
  payoutFlagBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  payoutFlagBadgeActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  payoutFlagText: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.primary,
  },
  payoutFlagTextActive: {
    color: '#FFFFFF',
  },
  payoutFlagBadgeUsdt: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  payoutFlagBadgeActiveUsdt: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  payoutFlagTextUsdt: {
    fontSize: 13,
    fontWeight: '900',
    color: '#10B981',
  },
  payoutFlagTextActiveUsdt: {
    color: '#FFFFFF',
  },
  toggleTextCol: {
    flex: 1,
  },
  payoutToggleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#707EAE',
  },
  payoutToggleTitleActive: {
    color: '#1B2559',
  },
  payoutToggleSubtitle: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#A0AEC0',
    marginTop: 0.5,
  },
  activeCheckDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.6,
  },
  portfolioHoldingsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  portfolioHoldingsText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
  },

  // SELECT ASSET TO SELL (SLEEK, COMPACT HORIZONTAL CARDS)
  assetsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10,
  },
  assetCard: {
    width: 108,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 9,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  assetCardActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#F5F8FF',
  },
  assetCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  miniLogoBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
  },
  miniLogoImg: {
    width: 17,
    height: 17,
  },
  glyphBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  changeTag: {
    paddingHorizontal: 4.5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  assetChangeText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  assetSymbol: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1B2559',
  },
  assetBalanceText: {
    fontSize: 10,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 1,
  },
  assetHoldingValue: {
    fontSize: 10.5,
    color: Colors.primary,
    fontWeight: '800',
    marginTop: 1,
  },

  // COMPACT & PROPORTIONAL CONVERTER CARD (Exact Cosmic Indigo Theme as BuyScreen)
  converterCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#4318FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  converterSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 13,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  converterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  converterSectionLabel: {
    color: '#C7D2FE',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  availableBalanceHint: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 9.5,
    fontWeight: '600',
  },
  converterInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  assetPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pillMiniLogo: {
    width: 18,
    height: 18,
  },
  pillGlyph: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  assetPillSymbol: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  converterInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
    padding: 0,
  },

  // Quick Percentage Chips
  quickChipsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  quickChip: {
    flex: 1,
    paddingVertical: 5.5,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  quickChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  quickChipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  quickChipTextActive: {
    color: Colors.primary,
    fontWeight: '900',
  },

  // Bridge Divider
  bridgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  bridgeLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  bridgeRateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  bridgeRateText: {
    color: '#E0E7FF',
    fontSize: 9.5,
    fontWeight: '700',
  },

  // Receive Section
  converterReceiveLabel: {
    color: '#C7D2FE',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  instantPayoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(5, 205, 153, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  instantPayoutText: {
    color: '#05CD99',
    fontSize: 9,
    fontWeight: '800',
  },
  receiveOutputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  receiveDestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  receiveDestSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  receiveDestName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  receiveOutputValue: {
    color: '#05CD99',
    fontSize: 22,
    fontWeight: '900',
  },

  // Receiving Bank Card
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    gap: 10,
    marginBottom: 12,
  },
  bankIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankInfoCol: {
    flex: 1,
  },
  bankTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bankName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    backgroundColor: '#E6FAF5',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  verifiedText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#05CD99',
  },
  bankAccountNo: {
    fontSize: 10.5,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 1,
  },
  ifscCode: {
    fontSize: 9.5,
    color: '#A0AEC0',
    marginTop: 0.5,
  },
  bankActiveDot: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: 'rgba(67, 24, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankActiveDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4.5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryLabel: {
    fontSize: 11.5,
    color: '#707EAE',
    fontWeight: '600',
  },
  tdsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 2,
  },
  summaryTotalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1B2559',
  },
  summaryTotalValue: {
    fontSize: 13.5,
    fontWeight: '900',
    color: Colors.primary,
  },

  // Submit Sell Button (Same Royal Gradient as BuyScreen)
  submitSellBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3.5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  submitSellGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 7,
  },
  submitSellBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  // Security Footer
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  securityFooterText: {
    fontSize: 10.5,
    color: '#707EAE',
    fontWeight: '700',
  },
});
