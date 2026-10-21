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

interface BuyScreenProps {
  onBack?: () => void;
  onNavigateToOrders?: () => void;
}

type CurrencyMode = 'INR' | 'USDT';

interface AssetData {
  id: string;
  symbol: string;
  name: string;
  inrPrice: number;
  usdtPrice: number;
  change: string;
  isPositive: boolean;
  isNative?: boolean;
  glyph?: string;
  badgeColor?: string;
}

export const BuyScreen: React.FC<BuyScreenProps> = ({
  onBack,
  onNavigateToOrders,
}) => {
  const { xCoinBalance, usdtBalance, refreshWallet } = useAuth();
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('INR');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('xcoin');
  const [payAmount, setPayAmount] = useState<string>('1500');
  const [inrPaymentMethod, setInrPaymentMethod] = useState<'upi' | 'netbanking' | 'wallet'>('upi');
  const [usdtPaymentMethod, setUsdtPaymentMethod] = useState<'vault' | 'network'>('vault');
  const [refreshCountdown, setRefreshCountdown] = useState<number>(30);

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

  const inrBalance = xCoinBalance * rates.xCoin;

  // Countdown timer for locked quotation rate
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update default states when currencyMode changes
  useEffect(() => {
    if (currencyMode === 'USDT' && selectedAssetId === 'usdt') {
      setSelectedAssetId('xcoin');
    }
    if (currencyMode === 'INR') {
      setPayAmount('1500');
    } else {
      setPayAmount('50');
    }
  }, [currencyMode]);

  const allAssets: AssetData[] = [
    {
      id: 'xcoin',
      symbol: 'xCoin',
      name: 'Zapp Pay Native',
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
      inrPrice: rates.usdt,
      usdtPrice: 1.0,
      change: '+0.05%',
      isPositive: true,
      glyph: '₮',
      badgeColor: '#10B981',
    },
  ];

  const displayAssets =
    currencyMode === 'USDT'
      ? allAssets.filter((a) => a.id !== 'usdt')
      : allAssets;

  const currentAsset =
    displayAssets.find((a) => a.id === selectedAssetId) || displayAssets[0];

  const currentPrice =
    currencyMode === 'INR' ? currentAsset.inrPrice : currentAsset.usdtPrice;

  const parsedPayAmount = parseFloat(payAmount) || 0;

  const estimatedTokens =
    currentPrice > 0 && parsedPayAmount > 0
      ? (parsedPayAmount / currentPrice).toFixed(2)
      : '0.00';

  const quickChips =
    currencyMode === 'INR'
      ? [
          { label: '₹500', val: '500' },
          { label: '₹1K', val: '1000' },
          { label: '₹2.5K', val: '2500' },
          { label: '₹5K', val: '5000' },
          { label: '₹10K', val: '10000' },
        ]
      : [
          { label: '25₮', val: '25' },
          { label: '50₮', val: '50' },
          { label: '100₮', val: '100' },
          { label: '250₮', val: '250' },
          { label: '500₮', val: '500' },
        ];

  const handleBuySubmit = async () => {
    const minAmount = currencyMode === 'INR' ? 100 : 5;
    const currencyLabel = currencyMode === 'INR' ? '₹' : 'USDT';

    if (parsedPayAmount < minAmount) {
      Alert.alert(
        'Minimum Purchase',
        `Minimum order is ${currencyLabel} ${minAmount} ${currencyMode}.`
      );
      return;
    }

    const paymentLabel =
      currencyMode === 'INR'
        ? inrPaymentMethod === 'upi'
          ? 'Instant UPI'
          : inrPaymentMethod === 'netbanking'
          ? 'NetBanking (IMPS)'
          : 'Zapp Pay INR Wallet'
        : usdtPaymentMethod === 'vault'
        ? 'Spot USDT Vault'
        : 'TRC-20 Network';

    try {
      const paymentMethod = currencyMode === 'INR' ? inrPaymentMethod : usdtPaymentMethod;
      const res = await apiClient.post('/orders/buy', {
        assetSymbol: currentAsset.symbol === 'xCoin' ? 'ZAP' : currentAsset.symbol,
        payAmount: parsedPayAmount,
        currencyMode,
        paymentMethod,
      });

      if (res.data?.success) {
        await refreshWallet();
        Alert.alert(
          'Order Executed! 🎉',
          `Purchased ${res.data.data?.tokensReceived || estimatedTokens} ${currentAsset.symbol} for ${
            currencyMode === 'INR' ? '₹ ' : ''
          }${parsedPayAmount.toLocaleString('en-IN')} ${
            currencyMode === 'USDT' ? 'USDT' : ''
          } via ${paymentLabel}.\n\nTokens are credited to your vault.`,
          [
            {
              text: 'View Orders',
              onPress: () => onNavigateToOrders && onNavigateToOrders(),
            },
            { text: 'Done', style: 'cancel' },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Order Failed', err.message || 'Failed to execute buy order.');
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/onboarding_bg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* Sleek Top Header */}
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
              <Text style={styles.headerTitle}>Buy Crypto</Text>
              <View style={styles.zeroFeeHeaderBadge}>
                <Ionicons name="flash" size={10} color="#05CD99" />
                <Text style={styles.zeroFeeHeaderText}>0% Fee</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Institutional Grade • Instant Settlement
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
          {/* COMPACT CURRENCY SELECTOR (INR vs USDT) */}
          <View style={styles.currencyToggleContainer}>
            <TouchableOpacity
              style={[
                styles.currencyToggleBtn,
                currencyMode === 'INR' && styles.currencyToggleBtnActive,
              ]}
              onPress={() => setCurrencyMode('INR')}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.currencyFlagBadge,
                  currencyMode === 'INR' && styles.currencyFlagBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.currencyFlagText,
                    currencyMode === 'INR' && styles.currencyFlagTextActive,
                  ]}
                >
                  ₹
                </Text>
              </View>
              <View style={styles.toggleTextCol}>
                <Text
                  style={[
                    styles.currencyToggleTitle,
                    currencyMode === 'INR' && styles.currencyToggleTitleActive,
                  ]}
                >
                  Pay with INR
                </Text>
                <Text style={styles.currencyToggleSubtitle}>
                  UPI / NetBanking
                </Text>
              </View>
              {currencyMode === 'INR' && (
                <View style={styles.activeCheckDot}>
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.currencyToggleBtn,
                currencyMode === 'USDT' && styles.currencyToggleBtnActive,
              ]}
              onPress={() => setCurrencyMode('USDT')}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.currencyFlagBadge,
                  styles.currencyFlagBadgeUsdt,
                  currencyMode === 'USDT' && styles.currencyFlagBadgeActiveUsdt,
                ]}
              >
                <Text
                  style={[
                    styles.currencyFlagTextUsdt,
                    currencyMode === 'USDT' && styles.currencyFlagTextActiveUsdt,
                  ]}
                >
                  ₮
                </Text>
              </View>
              <View style={styles.toggleTextCol}>
                <Text
                  style={[
                    styles.currencyToggleTitle,
                    currencyMode === 'USDT' && styles.currencyToggleTitleActive,
                  ]}
                >
                  Pay with USDT
                </Text>
                <Text style={styles.currencyToggleSubtitle}>
                  Spot Vault / P2P
                </Text>
              </View>
              {currencyMode === 'USDT' && (
                <View style={[styles.activeCheckDot, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* AVAILABLE SPEND BAR */}
          <View style={styles.balanceInfoCard}>
            <View style={styles.balanceInfoLeft}>
              <Ionicons name="wallet-outline" size={14} color="#4318FF" />
              <Text style={styles.balanceInfoLabel}>Available to spend:</Text>
            </View>
            <View style={styles.balanceInfoRight}>
              <Text style={styles.balanceInfoValue}>
                {currencyMode === 'INR'
                  ? `₹ ${inrBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                  : `${usdtBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT`}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setPayAmount(
                    currencyMode === 'INR'
                      ? inrBalance.toString()
                      : usdtBalance.toString()
                  )
                }
                style={styles.balanceMaxBtn}
              >
                <Text style={styles.balanceMaxText}>MAX</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SELECT ASSET TO BUY (SLEEK, COMPACT HORIZONTAL CARDS) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>
              SELECT ASSET TO BUY ({displayAssets.length})
            </Text>
            <View style={styles.liveQuoteTag}>
              <View style={styles.liveQuotePulse} />
              <Text style={styles.liveQuoteText}>
                Quote locked ({refreshCountdown}s)
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.assetsScroll}
          >
            {displayAssets.map((asset) => {
              const isSelected = selectedAssetId === asset.id;
              const priceDisplay =
                currencyMode === 'INR'
                  ? `₹ ${asset.inrPrice.toLocaleString('en-IN')}`
                  : `${asset.usdtPrice.toLocaleString('en-US')} USDT`;

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
                  <Text style={styles.assetPrice}>{priceDisplay}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* BALANCED & PROPORTIONAL CONVERTER CARD */}
          <LinearGradient
            colors={['#0B0920', '#140E3A', '#1E105C', '#3914D8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.converterCard}
          >
            {/* YOU PAY SECTION */}
            <View style={styles.converterSection}>
              <View style={styles.converterSectionHeader}>
                <Text style={styles.converterSectionLabel}>YOU PAY</Text>
                <Text style={styles.currencySubHint}>
                  {currencyMode === 'INR' ? 'Indian Rupee' : 'Tether USD'}
                </Text>
              </View>

              <View style={styles.converterInputRow}>
                <View style={styles.currencyPillBadge}>
                  <Text style={styles.currencyPillSymbol}>
                    {currencyMode === 'INR' ? '₹' : '₮'}
                  </Text>
                  <Text style={styles.currencyPillName}>{currencyMode}</Text>
                </View>

                <TextInput
                  style={styles.converterInput}
                  keyboardType="numeric"
                  value={payAmount}
                  onChangeText={setPayAmount}
                  placeholder="0"
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
                />
              </View>

              {/* Quick Preset Chips Row */}
              <View style={styles.quickChipsRow}>
                {quickChips.map((chip) => (
                  <TouchableOpacity
                    key={chip.val}
                    style={[
                      styles.quickChip,
                      payAmount === chip.val && styles.quickChipActive,
                    ]}
                    onPress={() => setPayAmount(chip.val)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickChipText,
                        payAmount === chip.val && styles.quickChipTextActive,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* SLEEK CONVERSION BRIDGE DIVIDER */}
            <View style={styles.bridgeRow}>
              <View style={styles.bridgeLine} />
              <View style={styles.bridgeRateBadge}>
                <Ionicons name="swap-vertical" size={13} color="#A5B4FC" />
                <Text style={styles.bridgeRateText}>
                  1 {currentAsset.symbol} ={' '}
                  {currencyMode === 'INR'
                    ? `₹${currentAsset.inrPrice.toLocaleString('en-IN')}`
                    : `${currentAsset.usdtPrice.toLocaleString('en-US')} USDT`}
                </Text>
              </View>
              <View style={styles.bridgeLine} />
            </View>

            {/* YOU RECEIVE SECTION */}
            <View style={styles.converterSection}>
              <View style={styles.converterSectionHeader}>
                <Text style={styles.converterReceiveLabel}>
                  YOU RECEIVE (ESTIMATED)
                </Text>
                <View style={styles.instantFillPill}>
                  <Ionicons name="shield-checkmark" size={10} color="#05CD99" />
                  <Text style={styles.instantFillText}>Instant Credit</Text>
                </View>
              </View>

              <View style={styles.receiveOutputRow}>
                <View style={styles.receiveTokenBadge}>
                  {currentAsset.isNative ? (
                    <Image
                      source={require('../../../assets/images/logo_transparent.png')}
                      style={styles.receiveMiniLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.receiveTokenGlyph}>
                      {currentAsset.glyph || currentAsset.symbol[0]}
                    </Text>
                  )}
                  <Text style={styles.receiveTokenSymbol}>
                    {currentAsset.symbol}
                  </Text>
                </View>

                <Text style={styles.receiveOutputValue}>
                  {estimatedTokens}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* PAYMENT METHOD SELECTOR */}
          <Text style={styles.sectionLabel}>
            {currencyMode === 'INR'
              ? 'SELECT INR PAYMENT METHOD'
              : 'SELECT USDT SOURCE'}
          </Text>

          {currencyMode === 'INR' ? (
            <View style={styles.paymentMethodsCol}>
              {/* UPI Instant */}
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  inrPaymentMethod === 'upi' && styles.methodCardActive,
                ]}
                onPress={() => setInrPaymentMethod('upi')}
                activeOpacity={0.85}
              >
                <View style={[styles.methodIconBadge, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="flash" size={17} color="#05CD99" />
                </View>
                <View style={styles.methodInfoCol}>
                  <View style={styles.methodTitleRow}>
                    <Text style={styles.methodTitle}>Instant UPI Auto-Pay</Text>
                    <View style={styles.freePill}>
                      <Text style={styles.freePillText}>0% Fee</Text>
                    </View>
                  </View>
                  <Text style={styles.methodSubtitle}>
                    Google Pay, PhonePe, Paytm, BHIM UPI
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    inrPaymentMethod === 'upi' && styles.radioCircleActive,
                  ]}
                >
                  {inrPaymentMethod === 'upi' && (
                    <View style={styles.radioCircleInner} />
                  )}
                </View>
              </TouchableOpacity>

              {/* NetBanking / IMPS */}
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  inrPaymentMethod === 'netbanking' && styles.methodCardActive,
                ]}
                onPress={() => setInrPaymentMethod('netbanking')}
                activeOpacity={0.85}
              >
                <View style={[styles.methodIconBadge, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="business" size={17} color="#4318FF" />
                </View>
                <View style={styles.methodInfoCol}>
                  <View style={styles.methodTitleRow}>
                    <Text style={styles.methodTitle}>NetBanking / IMPS</Text>
                    <View style={styles.verifiedBankPill}>
                      <Text style={styles.verifiedBankPillText}>Instant RTGS</Text>
                    </View>
                  </View>
                  <Text style={styles.methodSubtitle}>
                    HDFC, ICICI, SBI, Axis & 50+ Banks
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    inrPaymentMethod === 'netbanking' && styles.radioCircleActive,
                  ]}
                >
                  {inrPaymentMethod === 'netbanking' && (
                    <View style={styles.radioCircleInner} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Zapp Pay INR Fiat Balance */}
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  inrPaymentMethod === 'wallet' && styles.methodCardActive,
                ]}
                onPress={() => setInrPaymentMethod('wallet')}
                activeOpacity={0.85}
              >
                <View style={[styles.methodIconBadge, { backgroundColor: '#FAF5FF' }]}>
                  <Ionicons name="wallet" size={17} color="#7C3AED" />
                </View>
                <View style={styles.methodInfoCol}>
                  <View style={styles.methodTitleRow}>
                    <Text style={styles.methodTitle}>Zapp Pay INR Balance</Text>
                    <Text style={styles.fiatAvailTag}>
                      ₹ {inrBalance.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Text style={styles.methodSubtitle}>
                    1-Tap Instant Settlement from App Wallet
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    inrPaymentMethod === 'wallet' && styles.radioCircleActive,
                  ]}
                >
                  {inrPaymentMethod === 'wallet' && (
                    <View style={styles.radioCircleInner} />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.paymentMethodsCol}>
              {/* USDT Spot Vault */}
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  usdtPaymentMethod === 'vault' && styles.methodCardActive,
                ]}
                onPress={() => setUsdtPaymentMethod('vault')}
                activeOpacity={0.85}
              >
                <View style={[styles.methodIconBadge, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="shield-checkmark" size={17} color="#10B981" />
                </View>
                <View style={styles.methodInfoCol}>
                  <View style={styles.methodTitleRow}>
                    <Text style={styles.methodTitle}>Spot USDT Vault</Text>
                    <View style={styles.freePill}>
                      <Text style={styles.freePillText}>0 Gas Fee</Text>
                    </View>
                  </View>
                  <Text style={styles.methodSubtitle}>
                    Available: {usdtBalance.toLocaleString('en-US')} USDT
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    usdtPaymentMethod === 'vault' && styles.radioCircleActive,
                  ]}
                >
                  {usdtPaymentMethod === 'vault' && (
                    <View style={styles.radioCircleInner} />
                  )}
                </View>
              </TouchableOpacity>

              {/* TRC-20 External Transfer */}
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  usdtPaymentMethod === 'network' && styles.methodCardActive,
                ]}
                onPress={() => setUsdtPaymentMethod('network')}
                activeOpacity={0.85}
              >
                <View style={[styles.methodIconBadge, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="git-network-outline" size={17} color="#3B82F6" />
                </View>
                <View style={styles.methodInfoCol}>
                  <View style={styles.methodTitleRow}>
                    <Text style={styles.methodTitle}>TRC-20 / Arbitrum</Text>
                    <View style={styles.verifiedBankPill}>
                      <Text style={styles.verifiedBankPillText}>Fast Network</Text>
                    </View>
                  </View>
                  <Text style={styles.methodSubtitle}>
                    Direct Web3 deposit from external wallet
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    usdtPaymentMethod === 'network' && styles.radioCircleActive,
                  ]}
                >
                  {usdtPaymentMethod === 'network' && (
                    <View style={styles.radioCircleInner} />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* COMPACT SUMMARY BREAKDOWN CARD */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Execution Price</Text>
              <Text style={styles.summaryValue}>
                1 {currentAsset.symbol} ={' '}
                {currencyMode === 'INR'
                  ? `₹${currentAsset.inrPrice.toLocaleString('en-IN')}`
                  : `${currentAsset.usdtPrice.toLocaleString('en-US')} USDT`}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform Fee (Zero Fee Promo)</Text>
              <Text style={[styles.summaryValue, { color: '#05CD99' }]}>
                {currencyMode === 'INR' ? '₹ 0.00 (FREE)' : '0.00 USDT (FREE)'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Max Slippage Protection</Text>
              <Text style={styles.summaryValue}>&lt; 0.01% Guaranteed</Text>
            </View>

            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Total Payable</Text>
              <Text style={styles.summaryTotalValue}>
                {currencyMode === 'INR' ? '₹ ' : ''}
                {parsedPayAmount.toLocaleString('en-IN')}{' '}
                {currencyMode === 'USDT' ? 'USDT' : ''}
              </Text>
            </View>
          </View>

          {/* PRIMARY BUY BUTTON */}
          <TouchableOpacity
            style={styles.submitBuyBtn}
            onPress={handleBuySubmit}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#4318FF', '#3110C6', '#1A0D6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitBuyGradient}
            >
              <Ionicons name="arrow-down-circle" size={19} color="#FFFFFF" />
              <Text style={styles.submitBuyBtnText}>
                Buy {currentAsset.symbol} with {currencyMode}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Security Guarantee Note */}
          <View style={styles.securityFooter}>
            <Ionicons name="shield-checkmark" size={13} color="#05CD99" />
            <Text style={styles.securityFooterText}>
              256-Bit Escrow Vault • 100% FIU-IND Compliant
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

  // Top Header
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
  zeroFeeHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(5, 205, 153, 0.14)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  zeroFeeHeaderText: {
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

  // COMPACT CURRENCY TOGGLE (INR vs USDT)
  currencyToggleContainer: {
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
  currencyToggleBtn: {
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
  currencyToggleBtnActive: {
    backgroundColor: '#F5F8FF',
    borderColor: Colors.primary,
  },
  currencyFlagBadge: {
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
  currencyFlagBadgeActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  currencyFlagText: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.primary,
  },
  currencyFlagTextActive: {
    color: '#FFFFFF',
  },
  currencyFlagBadgeUsdt: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  currencyFlagBadgeActiveUsdt: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  currencyFlagTextUsdt: {
    fontSize: 13,
    fontWeight: '900',
    color: '#10B981',
  },
  currencyFlagTextActiveUsdt: {
    color: '#FFFFFF',
  },
  toggleTextCol: {
    flex: 1,
  },
  currencyToggleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#707EAE',
  },
  currencyToggleTitleActive: {
    color: '#1B2559',
  },
  currencyToggleSubtitle: {
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

  // Spendable Balance Bar
  balanceInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    marginBottom: 12,
  },
  balanceInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceInfoLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#707EAE',
  },
  balanceInfoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  balanceInfoValue: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#1B2559',
  },
  balanceMaxBtn: {
    backgroundColor: 'rgba(67, 24, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  balanceMaxText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: Colors.primary,
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
  liveQuoteTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveQuotePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#05CD99',
  },
  liveQuoteText: {
    fontSize: 10,
    color: '#05CD99',
    fontWeight: '700',
  },

  // SELECT ASSET CAROUSEL (PROPORTIONAL & SLEEK)
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
  assetPrice: {
    fontSize: 10.5,
    color: Colors.primary,
    fontWeight: '800',
    marginTop: 1,
  },

  // COMPACT & PROPORTIONAL CONVERTER CARD
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
  currencySubHint: {
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
  currencyPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  currencyPillSymbol: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  currencyPillName: {
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

  // Quick Chips
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
    fontWeight: '700',
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

  // You Receive Section
  converterReceiveLabel: {
    color: '#C7D2FE',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  instantFillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(5, 205, 153, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  instantFillText: {
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
  receiveTokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiveMiniLogo: {
    width: 22,
    height: 22,
  },
  receiveTokenGlyph: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  receiveTokenSymbol: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  receiveOutputValue: {
    color: '#05CD99',
    fontSize: 24,
    fontWeight: '900',
  },

  // Payment Methods
  paymentMethodsCol: {
    gap: 8,
    marginBottom: 12,
    marginTop: 6,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    gap: 10,
  },
  methodCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F5F8FF',
  },
  methodIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfoCol: {
    flex: 1,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  freePill: {
    backgroundColor: 'rgba(5, 205, 153, 0.14)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  freePillText: {
    color: '#05CD99',
    fontSize: 9,
    fontWeight: '800',
  },
  verifiedBankPill: {
    backgroundColor: 'rgba(67, 24, 255, 0.09)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  verifiedBankPillText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  fiatAvailTag: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#7C3AED',
  },
  methodSubtitle: {
    fontSize: 10.5,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 1,
  },
  radioCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: Colors.primary,
  },
  radioCircleInner: {
    width: 7.5,
    height: 7.5,
    borderRadius: 3.75,
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
    fontSize: 12.5,
    fontWeight: '900',
    color: '#1B2559',
  },
  summaryTotalValue: {
    fontSize: 13.5,
    fontWeight: '900',
    color: Colors.primary,
  },

  // Submit Button
  submitBuyBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3.5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  submitBuyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 7,
  },
  submitBuyBtnText: {
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
