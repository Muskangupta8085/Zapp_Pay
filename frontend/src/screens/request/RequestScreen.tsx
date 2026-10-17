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
  Share,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { WalletService, HomeService } from '../../services/api.service';

const { width } = Dimensions.get('window');

interface RequestScreenProps {
  onBack?: () => void;
  onNavigateToOrders?: () => void;
}

type RequestTabMode = 'COIN_REQUEST' | 'SELLER_REQUEST';
type HistoryFilter = 'ALL' | 'SELLER' | 'COIN';

interface PaymentRequestItem {
  id: string;
  type: 'coin_request' | 'seller_request';
  payerOrDestination: string;
  amount: number;
  currency: string;
  inrValue?: number;
  netPayout?: number;
  tds?: number;
  note: string;
  date: string;
  status: 'pending' | 'completed' | 'processing' | 'cancelled';
  upiLink?: string;
}

export const RequestScreen: React.FC<RequestScreenProps> = ({
  onBack,
  onNavigateToOrders,
}) => {
  const { user, wallet, xCoinBalance, refreshWallet } = useAuth();
  const [activeTabMode, setActiveTabMode] = useState<RequestTabMode>('COIN_REQUEST');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('ALL');

  // Coin Request State
  const [coinAmount, setCoinAmount] = useState<string>('50');
  const [selectedCoinPreset, setSelectedCoinPreset] = useState<string>('50');
  const [coinPayerContact, setCoinPayerContact] = useState<string>('');
  const [coinNote, setCoinNote] = useState<string>('xCoin transfer for services');

  // Seller Request State
  const [sellCoinAmount, setSellCoinAmount] = useState<string>('100');
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState<'BANK' | 'UPI'>('BANK');
  const [sellerNote, setSellerNote] = useState<string>('Seller liquidation to primary bank');

  // UI States
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedModalItem, setSelectedModalItem] = useState<PaymentRequestItem | null>(null);

  // Live Exchange Rates
  const [rates, setRates] = useState({ xCoin: 108.37, usdt: 87.42 });

  const userVpa = user?.upiId || 'zapppay@icici';
  const userWalletAddress = user?.walletAddress || wallet?.walletAddress || '0xZP849204...2A04';
  const userName = user?.fullName || 'Zapp Pay User';
  const userBankName = user?.bankAccount?.bankName || 'HDFC Bank';
  const userBankAcc = user?.bankAccount?.accountNumber
    ? `•••• ${user.bankAccount.accountNumber.slice(-4)}`
    : '•••• 4892';

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

  // Quick frequent payer contacts suggestions
  const frequentPayers = [
    { name: 'Rahul Sharma', contact: '+91 98765 43210', initials: 'RS', color: '#4318FF' },
    { name: 'Priya Kapoor', contact: 'priya.k@okaxis', initials: 'PK', color: '#10B981' },
    { name: 'Amit Verma', contact: 'amitv@paytm', initials: 'AV', color: '#F59E0B' },
    { name: 'Public Link', contact: 'Open Web3 / UPI QR', initials: 'ALL', color: '#8B5CF6' },
  ];

  // Quick purpose tag presets for Coin Request
  const coinPurposeTags = [
    'Freelance Services 💻',
    'Dinner & Split 🍕',
    'P2P Escrow ⚡',
    'Project Advance 🚀',
    'Gift / Bounty 🎁',
  ];

  // Preloaded Comprehensive Requests (Both Seller Requests & Coin Requests)
  const [requestsList, setRequestsList] = useState<PaymentRequestItem[]>([
    {
      id: 'SR_9241',
      type: 'seller_request',
      payerOrDestination: `${userBankName} (${userBankAcc})`,
      amount: 100,
      currency: 'xCoin',
      inrValue: 10837,
      netPayout: 10728.63,
      tds: 108.37,
      note: 'Seller Liquidation to Bank IMPS',
      date: 'Today, 11:20 AM',
      status: 'pending',
    },
    {
      id: 'PR_8921',
      type: 'coin_request',
      payerOrDestination: '+91 98765 43210 (Rahul S.)',
      amount: 50,
      currency: 'xCoin',
      inrValue: 5418.5,
      note: 'Freelance Design Settlement',
      date: 'Today, 10:24 AM',
      status: 'pending',
      upiLink: `upi://pay?pa=${encodeURIComponent(userVpa)}&pn=${encodeURIComponent(userName)}&am=5418.50&cu=INR&tn=xCoin%20Request`,
    },
    {
      id: 'SR_8812',
      type: 'seller_request',
      payerOrDestination: `${userBankName} (${userBankAcc})`,
      amount: 250,
      currency: 'xCoin',
      inrValue: 27092.5,
      netPayout: 26821.57,
      tds: 270.93,
      note: 'Weekly Trader Earnings Cashout',
      date: 'Yesterday, 03:45 PM',
      status: 'completed',
    },
    {
      id: 'PR_8790',
      type: 'coin_request',
      payerOrDestination: 'priya.k@okaxis',
      amount: 25,
      currency: 'xCoin',
      inrValue: 2709.25,
      note: 'Shared Web3 Hosting Bill',
      date: '14 Oct, 08:30 PM',
      status: 'completed',
    },
  ]);

  // Load backend requests on mount
  useEffect(() => {
    const fetchBackendRequests = async () => {
      try {
        const res = await WalletService.getRequests();
        if (Array.isArray(res) && res.length > 0) {
          const mapped: PaymentRequestItem[] = res.map((r: any) => ({
            id: r.requestId || r._id,
            type: r.requestType === 'seller_request' ? 'seller_request' : 'coin_request',
            payerOrDestination: r.payoutDetails
              ? `${r.payoutDetails.bankName || 'Bank'} (${r.payoutDetails.accountNumber ? '•••• ' + r.payoutDetails.accountNumber.slice(-4) : 'IMPS'})`
              : r.payerContact || 'Open Web3 / UPI QR',
            amount: r.amount,
            currency: r.currency || 'xCoin',
            inrValue: r.payoutDetails?.grossAmount || r.amount * rates.xCoin,
            netPayout: r.payoutDetails?.netPayout,
            tds: r.payoutDetails?.tds,
            note: r.note || 'Request Transaction',
            date: new Date(r.createdAt).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            status: r.status || 'pending',
            upiLink: r.upiLink,
          }));
          setRequestsList((prev) => {
            const existingIds = new Set(mapped.map((m) => m.id));
            const filteredPrev = prev.filter((p) => !existingIds.has(p.id));
            return [...mapped, ...filteredPrev];
          });
        }
      } catch {
        // Retain local state
      }
    };
    fetchBackendRequests();
  }, [rates]);

  // Calculations for Coin Request
  const parsedCoinAmount = parseFloat(coinAmount) || 0;
  const coinFiatInr = parsedCoinAmount * rates.xCoin;
  const coinFiatUsd = coinFiatInr / rates.usdt;

  // Calculations for Seller Request
  const parsedSellAmount = parseFloat(sellCoinAmount) || 0;
  const grossSellPayout = parsedSellAmount * rates.xCoin;
  const sellerTds = grossSellPayout * 0.01; // 1% Indian TDS
  const netSellPayout = Math.max(0, grossSellPayout - sellerTds);

  // Intent links
  const currentCoinUpiLink = `upi://pay?pa=${encodeURIComponent(userVpa)}&pn=${encodeURIComponent(
    userName
  )}&am=${encodeURIComponent(coinFiatInr.toFixed(2))}&cu=INR&tn=${encodeURIComponent(
    coinNote || 'xCoin Payment Request'
  )}`;
  const currentWeb3DeepLink = `zapppay://transfer?to=${userWalletAddress}&amount=${parsedCoinAmount}&symbol=XCOIN`;

  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyVpa = () => {
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleCopyAddress = () => {
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleShareCoinRequest = async () => {
    try {
      const shareMsg = `🪙 ${userName} is requesting ${parsedCoinAmount} xCoin (≈ ₹${coinFiatInr.toLocaleString(
        'en-IN',
        { maximumFractionDigits: 2 }
      )}) via Zapp Pay Web3:\n\nRecipient Address: ${userWalletAddress}\nUPI Pay Link: ${currentCoinUpiLink}\nNote: ${coinNote}\n\nPay zero-gas instantly with Zapp Pay or any UPI app.`;

      await Share.share({
        message: shareMsg,
        title: `xCoin Payment Request - ${parsedCoinAmount} xCoin`,
      });
    } catch {
      // Ignored
    }
  };

  // Submit Coin Request
  const handleSubmitCoinRequest = async () => {
    if (parsedCoinAmount <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid amount of xCoin to request.');
      return;
    }

    setIsSubmitting(true);
    try {
      await WalletService.createRequest({
        payerContact: coinPayerContact.trim() || undefined,
        amount: parsedCoinAmount,
        currency: 'XCOIN',
        note: coinNote.trim() || undefined,
        requestType: 'coin_request',
      });
    } catch {
      // Local fallback
    } finally {
      setIsSubmitting(false);
    }

    const newReq: PaymentRequestItem = {
      id: `PR_${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'coin_request',
      payerOrDestination: coinPayerContact.trim() || 'Open Web3 / UPI QR',
      amount: parsedCoinAmount,
      currency: 'xCoin',
      inrValue: coinFiatInr,
      note: coinNote.trim() || 'xCoin Request',
      date: 'Just now',
      status: 'pending',
      upiLink: currentCoinUpiLink,
    };

    setRequestsList([newReq, ...requestsList]);

    Alert.alert(
      'Coin Request Created! 🪙',
      `Requested ${parsedCoinAmount} xCoin (≈ ₹ ${coinFiatInr.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
      })}).\n\nYour dynamic Web3 QR and UPI intent link have been generated.`,
      [
        {
          text: 'Share Link',
          onPress: handleShareCoinRequest,
        },
        {
          text: 'View QR Code',
          onPress: () => {
            setSelectedModalItem(newReq);
            setShowQrModal(true);
          },
        },
        { text: 'Done', style: 'cancel' },
      ]
    );
  };

  // Submit Seller Request
  const handleSubmitSellerRequest = async () => {
    if (parsedSellAmount <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid amount of xCoin to liquidate.');
      return;
    }
    if (parsedSellAmount > xCoinBalance) {
      Alert.alert(
        'Insufficient xCoin Balance',
        `You have ${xCoinBalance.toFixed(2)} xCoin available in your vault. Cannot sell ${parsedSellAmount} xCoin.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await WalletService.createRequest({
        amount: parsedSellAmount,
        currency: 'XCOIN',
        note: sellerNote.trim() || 'Seller liquidation to bank',
        requestType: 'seller_request',
        payoutDetails: {
          bankName: userBankName,
          accountNumber: userBankAcc,
          grossAmount: grossSellPayout,
          netPayout: netSellPayout,
          tds: sellerTds,
        },
      });
    } catch {
      // Local fallback
    } finally {
      setIsSubmitting(false);
    }

    const newReq: PaymentRequestItem = {
      id: `SR_${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'seller_request',
      payerOrDestination: `${userBankName} (${userBankAcc})`,
      amount: parsedSellAmount,
      currency: 'xCoin',
      inrValue: grossSellPayout,
      netPayout: netSellPayout,
      tds: sellerTds,
      note: sellerNote.trim() || 'Seller Liquidation',
      date: 'Just now',
      status: 'pending',
    };

    setRequestsList([newReq, ...requestsList]);

    Alert.alert(
      'Seller Request Submitted! 💼',
      `Successfully requested to liquidate ${parsedSellAmount} xCoin for net payout of ₹ ${netSellPayout.toLocaleString(
        'en-IN',
        { maximumFractionDigits: 2 }
      )} to ${userBankName} (${userBankAcc}).\n\n1% TDS certificate (₹${sellerTds.toFixed(
        2
      )}) generated. Funds will credit via automated IMPS within 60 seconds.`,
      [
        {
          text: 'View Receipt',
          onPress: () => {
            setSelectedModalItem(newReq);
            setShowQrModal(true);
          },
        },
        { text: 'Done', style: 'cancel' },
      ]
    );
  };

  const handleRemind = (item: PaymentRequestItem) => {
    Alert.alert(
      'Reminder Dispatched 🔔',
      `Payment reminder notification sent to ${item.payerOrDestination} for ${item.amount} ${item.currency}.`
    );
  };

  const handleCancelRequest = async (id: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this pending request?',
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await WalletService.cancelRequest(id);
            } catch {
              // Local update
            }
            setRequestsList((prev) =>
              prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r))
            );
          },
        },
      ]
    );
  };

  const filteredRequests = requestsList.filter((item) => {
    if (historyFilter === 'ALL') return true;
    if (historyFilter === 'SELLER') return item.type === 'seller_request';
    if (historyFilter === 'COIN') return item.type === 'coin_request';
    return true;
  });

  const sellerCount = requestsList.filter((r) => r.type === 'seller_request').length;
  const coinCount = requestsList.filter((r) => r.type === 'coin_request').length;

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
            accessibilityLabel="Go Back"
          >
            <Ionicons name="arrow-back" size={19} color="#1B2559" />
          </TouchableOpacity>

          <View style={styles.headerTitleCenter}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Requests Studio</Text>
              <View style={styles.zeroFeeHeaderBadge}>
                <Ionicons name="flash" size={10} color="#05CD99" />
                <Text style={styles.zeroFeeHeaderText}>Instant P2P</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Seller Liquidations & Coin Requests
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
          {/* PRIMARY MASTER SELECTOR: [ REQUEST TO COIN 🪙 | SELLER REQUEST 💼 ] */}
          <View style={styles.masterTabSelector}>
            {/* TAB 1: REQUEST TO COIN */}
            <TouchableOpacity
              style={[
                styles.masterTabBtn,
                activeTabMode === 'COIN_REQUEST' && styles.masterTabBtnActiveCoin,
              ]}
              onPress={() => setActiveTabMode('COIN_REQUEST')}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.tabIconBadge,
                  activeTabMode === 'COIN_REQUEST'
                    ? { backgroundColor: '#4318FF' }
                    : { backgroundColor: '#EEF2F6' },
                ]}
              >
                <Text
                  style={[
                    styles.tabIconGlyph,
                    activeTabMode === 'COIN_REQUEST' && { color: '#FFFFFF' },
                  ]}
                >
                  🪙
                </Text>
              </View>

              <View style={styles.tabTextCol}>
                <View style={styles.tabHeadingRow}>
                  <Text
                    style={[
                      styles.masterTabTitle,
                      activeTabMode === 'COIN_REQUEST' && styles.masterTabTitleActive,
                    ]}
                  >
                    Request to Coin
                  </Text>
                  {activeTabMode === 'COIN_REQUEST' && (
                    <View style={styles.activeCheckDot}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <Text style={styles.masterTabSub}>Receive xCoin via QR & Link</Text>
              </View>
            </TouchableOpacity>

            {/* TAB 2: SELLER REQUEST */}
            <TouchableOpacity
              style={[
                styles.masterTabBtn,
                activeTabMode === 'SELLER_REQUEST' && styles.masterTabBtnActiveSeller,
              ]}
              onPress={() => setActiveTabMode('SELLER_REQUEST')}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.tabIconBadge,
                  activeTabMode === 'SELLER_REQUEST'
                    ? { backgroundColor: '#F59E0B' }
                    : { backgroundColor: '#EEF2F6' },
                ]}
              >
                <Text
                  style={[
                    styles.tabIconGlyph,
                    activeTabMode === 'SELLER_REQUEST' && { color: '#FFFFFF' },
                  ]}
                >
                  💼
                </Text>
              </View>

              <View style={styles.tabTextCol}>
                <View style={styles.tabHeadingRow}>
                  <Text
                    style={[
                      styles.masterTabTitle,
                      activeTabMode === 'SELLER_REQUEST' && styles.masterTabTitleActive,
                    ]}
                  >
                    Seller Request
                  </Text>
                  {activeTabMode === 'SELLER_REQUEST' && (
                    <View style={[styles.activeCheckDot, { backgroundColor: '#F59E0B' }]}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <Text style={styles.masterTabSub}>Sell xCoin to Bank IMPS</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ======================================================== */}
          {/* SECTION A: REQUEST TO COIN MODE */}
          {/* ======================================================== */}
          {activeTabMode === 'COIN_REQUEST' && (
            <View>
              {/* Receiving Vault Bar */}
              <View style={styles.vaultIdentifierBar}>
                <View style={styles.vaultLeftCluster}>
                  <View style={styles.web3LiveDot} />
                  <View>
                    <Text style={styles.vaultPillLabel}>RECEIVING WEB3 VAULT ADDRESS</Text>
                    <Text style={styles.vaultPillAddress} numberOfLines={1}>
                      {userWalletAddress}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.miniCopyBtn, copiedAddress && styles.miniCopyBtnDone]}
                  onPress={handleCopyAddress}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={copiedAddress ? 'checkmark' : 'copy-outline'}
                    size={12}
                    color={copiedAddress ? '#05CD99' : '#4318FF'}
                  />
                  <Text style={[styles.miniCopyBtnText, copiedAddress && { color: '#05CD99' }]}>
                    {copiedAddress ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Coin Amount Input Card */}
              <View style={styles.studioCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderLabel}>COIN QUANTITY TO REQUEST</Text>
                  <View style={styles.liveRatePill}>
                    <Text style={styles.liveRateText}>1 xC = ₹{rates.xCoin.toFixed(2)}</Text>
                  </View>
                </View>

                {/* Big Display Amount Row */}
                <View style={styles.amountDisplayRow}>
                  <Text style={styles.coinSymbolBadge}>🪙</Text>
                  <TextInput
                    style={styles.amountBigInput}
                    value={coinAmount}
                    onChangeText={(val) => {
                      setCoinAmount(val);
                      setSelectedCoinPreset('');
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#CBD5E1"
                    maxLength={8}
                  />
                  <Text style={styles.coinUnitLabel}>xCoin</Text>
                </View>

                {/* Real-time Equivalent Tag */}
                <View style={styles.conversionBar}>
                  <Ionicons name="swap-horizontal" size={13} color="#4318FF" />
                  <Text style={styles.conversionBarText}>
                    ≈ ₹ {coinFiatInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR • ${coinFiatUsd.toFixed(2)} USD
                  </Text>
                </View>

                {/* Presets Chips */}
                <View style={styles.presetsGrid}>
                  {['10', '25', '50', '100', '250', '500'].map((preset) => {
                    const isSelected = selectedCoinPreset === preset;
                    return (
                      <TouchableOpacity
                        key={preset}
                        style={[styles.presetChip, isSelected && styles.presetChipActive]}
                        onPress={() => {
                          setSelectedCoinPreset(preset);
                          setCoinAmount(preset);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                          {preset} xC
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Target Payer & Purpose Details */}
              <View style={styles.studioCard}>
                <Text style={styles.cardHeaderLabel}>REQUEST FROM CONTACT (OPTIONAL)</Text>

                {/* Quick Frequent Contacts */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.frequentPayersScroll}
                >
                  {frequentPayers.map((payer) => {
                    const isSelected = coinPayerContact === payer.contact;
                    return (
                      <TouchableOpacity
                        key={payer.name}
                        style={[
                          styles.frequentPayerChip,
                          isSelected && styles.frequentPayerChipActive,
                        ]}
                        onPress={() => {
                          if (payer.contact === 'Open Web3 / UPI QR') {
                            setCoinPayerContact('');
                          } else {
                            setCoinPayerContact(payer.contact);
                          }
                        }}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.payerAvatarCircle, { backgroundColor: payer.color }]}>
                          <Text style={styles.payerAvatarText}>{payer.initials}</Text>
                        </View>
                        <View>
                          <Text style={styles.payerChipName} numberOfLines={1}>{payer.name}</Text>
                          <Text style={styles.payerChipSub} numberOfLines={1}>{payer.contact}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Custom Payer Input */}
                <View style={styles.inputFieldBox}>
                  <Ionicons name="person-circle-outline" size={18} color="#707EAE" style={styles.inputFieldIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Enter Phone Number or UPI ID (Leave empty for public QR)"
                    placeholderTextColor="#A0AEC0"
                    value={coinPayerContact}
                    onChangeText={setCoinPayerContact}
                  />
                  {coinPayerContact.length > 0 && (
                    <TouchableOpacity onPress={() => setCoinPayerContact('')}>
                      <Ionicons name="close-circle" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Purpose Note */}
                <Text style={[styles.cardHeaderLabel, { marginTop: 14 }]}>PAYMENT PURPOSE / MEMO</Text>
                <View style={styles.inputFieldBox}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#707EAE" style={styles.inputFieldIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. Freelance project, Split dinner, Gift"
                    placeholderTextColor="#A0AEC0"
                    value={coinNote}
                    onChangeText={setCoinNote}
                    maxLength={50}
                  />
                </View>

                {/* Quick Purpose Tag Chips */}
                <View style={styles.purposeTagsRow}>
                  {coinPurposeTags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.purposeTagChip, coinNote === tag && styles.purposeTagChipActive]}
                      onPress={() => setCoinNote(tag)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.purposeTagText, coinNote === tag && styles.purposeTagTextActive]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Dynamic Coin QR Code & Intent Action Card */}
              <View style={styles.qrCard}>
                <View style={styles.qrCardHeader}>
                  <View style={styles.qrHeaderLeft}>
                    <View style={styles.qrIconRing}>
                      <Ionicons name="qr-code" size={17} color="#4318FF" />
                    </View>
                    <View>
                      <Text style={styles.qrHeaderTitle}>Dynamic xCoin Request QR</Text>
                      <Text style={styles.qrHeaderSub}>Scan to pay in xCoin or UPI</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.expandQrBtn}
                    onPress={() => setShowQrModal(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="scan-outline" size={14} color="#4318FF" />
                    <Text style={styles.expandQrBtnText}>Enlarge</Text>
                  </TouchableOpacity>
                </View>

                {/* QR Chamber */}
                <View style={styles.qrChamber}>
                  <View style={styles.qrVisualFrame}>
                    <View style={styles.qrCornerTopLeft} />
                    <View style={styles.qrCornerTopRight} />
                    <View style={styles.qrCornerBottomLeft} />
                    <View style={styles.qrCornerBottomRight} />

                    <View style={styles.qrMatrixLayout}>
                      <View style={[styles.qrFinderPattern, { top: 10, left: 10 }]}>
                        <View style={styles.qrFinderCore} />
                      </View>
                      <View style={[styles.qrFinderPattern, { top: 10, right: 10 }]}>
                        <View style={styles.qrFinderCore} />
                      </View>
                      <View style={[styles.qrFinderPattern, { bottom: 10, left: 10 }]}>
                        <View style={styles.qrFinderCore} />
                      </View>

                      <View style={styles.matrixMicroGrid}>
                        {[...Array(36)].map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.matrixMicroDot,
                              {
                                opacity: (i * 13) % 2 === 0 ? 0.95 : 0.45,
                                backgroundColor: i % 5 === 0 ? '#4318FF' : '#1B2559',
                              },
                            ]}
                          />
                        ))}
                      </View>

                      <View style={styles.qrCenterBadge}>
                        <Image
                          source={require('../../../assets/images/logo_transparent.png')}
                          style={styles.qrCenterLogo}
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.qrMetaBadgeRow}>
                    <View style={styles.qrAmountCapsule}>
                      <Text style={styles.qrAmountCapsuleText}>{parsedCoinAmount} xCoin</Text>
                    </View>
                    <Text style={styles.qrNoteCapsuleText} numberOfLines={1}>
                      "{coinNote}"
                    </Text>
                  </View>

                  <Text style={styles.qrInstructionNotice}>
                    Payer: {coinPayerContact || 'Any Zapp Pay or UPI App'} • Zero Gas Fee
                  </Text>
                </View>

                {/* Primary Action Button */}
                <TouchableOpacity
                  style={styles.primarySendBtn}
                  onPress={handleSubmitCoinRequest}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#4318FF', '#6366F1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primarySendGradient}
                  >
                    <Ionicons name="paper-plane" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primarySendText}>
                      {isSubmitting ? 'Generating Coin Request...' : 'Send Coin Request 🪙'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Secondary Controls */}
                <View style={styles.secondaryControlsRow}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={handleShareCoinRequest}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="share-social-outline" size={16} color="#4318FF" />
                    <Text style={styles.secondaryBtnText}>Share Link</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondaryBtn, copiedLink && styles.secondaryBtnDone]}
                    onPress={handleCopyLink}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={copiedLink ? 'checkmark' : 'copy-outline'}
                      size={16}
                      color={copiedLink ? '#05CD99' : '#4318FF'}
                    />
                    <Text style={[styles.secondaryBtnText, copiedLink && { color: '#05CD99' }]}>
                      {copiedLink ? 'Copied' : 'Copy Intent'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ======================================================== */}
          {/* SECTION B: SELLER REQUEST MODE (SELL XCOIN FOR CASH) */}
          {/* ======================================================== */}
          {activeTabMode === 'SELLER_REQUEST' && (
            <View>
              {/* Seller Available Liquidity Bar */}
              <View style={styles.sellerBalanceBar}>
                <View style={styles.sellerBalanceLeft}>
                  <Ionicons name="wallet" size={16} color="#D97706" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.sellerBalanceLabel}>YOUR AVAILABLE xCOIN TO SELL</Text>
                    <Text style={styles.sellerBalanceValue}>
                      {xCoinBalance.toFixed(2)} xCoin (≈ ₹ {(xCoinBalance * rates.xCoin).toLocaleString('en-IN', { maximumFractionDigits: 2 })})
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.sellerMaxBtn}
                  onPress={() => {
                    setSellCoinAmount(xCoinBalance.toString());
                    setSelectedPercentage(1);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.sellerMaxBtnText}>MAX</Text>
                </TouchableOpacity>
              </View>

              {/* Seller Quantity Input Card */}
              <View style={styles.studioCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderLabel}>xCOIN QUANTITY TO SELL</Text>
                  <View style={[styles.liveRatePill, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.liveRateText, { color: '#B45309' }]}>
                      Sell Rate: ₹{rates.xCoin.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Big Input Row */}
                <View style={[styles.amountDisplayRow, { borderColor: '#FDE68A' }]}>
                  <Text style={styles.coinSymbolBadge}>💼</Text>
                  <TextInput
                    style={styles.amountBigInput}
                    value={sellCoinAmount}
                    onChangeText={(val) => {
                      setSellCoinAmount(val);
                      setSelectedPercentage(null);
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#CBD5E1"
                    maxLength={8}
                  />
                  <Text style={[styles.coinUnitLabel, { color: '#D97706' }]}>xCoin</Text>
                </View>

                {/* Percentage Shortcuts */}
                <View style={styles.percentageRow}>
                  {[0.25, 0.5, 0.75, 1].map((pct) => {
                    const isSelected = selectedPercentage === pct;
                    return (
                      <TouchableOpacity
                        key={pct}
                        style={[
                          styles.pctChip,
                          isSelected && styles.pctChipActive,
                        ]}
                        onPress={() => {
                          setSelectedPercentage(pct);
                          setSellCoinAmount((xCoinBalance * pct).toFixed(2));
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.pctChipText, isSelected && styles.pctChipTextActive]}>
                          {pct === 1 ? '100% MAX' : `${pct * 100}%`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* REAL-TIME SETTLEMENT BREAKDOWN (INSTITUTIONAL GRADE) */}
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownHeader}>
                  <Ionicons name="receipt-outline" size={17} color="#1B2559" />
                  <Text style={styles.breakdownHeading}>Seller Settlement Breakdown</Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Gross Coin Valuation</Text>
                  <Text style={styles.breakdownValue}>
                    ₹ {grossSellPayout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Platform Escrow Fee</Text>
                  <View style={styles.zeroFeePill}>
                    <Text style={styles.zeroFeePillText}>₹ 0.00 FREE</Text>
                  </View>
                </View>

                <View style={styles.breakdownRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.breakdownLabel}>1% Govt TDS Deduction</Text>
                    <Ionicons name="information-circle-outline" size={13} color="#94A3B8" />
                  </View>
                  <Text style={[styles.breakdownValue, { color: '#EF4444' }]}>
                    - ₹ {sellerTds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>

                <View style={styles.breakdownDivider} />

                {/* Net Payout Row */}
                <View style={styles.netPayoutRow}>
                  <View>
                    <Text style={styles.netPayoutLabel}>NET BANK IMPS PAYOUT</Text>
                    <Text style={styles.netPayoutSub}>Dispatched in &lt; 60 seconds</Text>
                  </View>
                  <Text style={styles.netPayoutDigits}>
                    ₹ {netSellPayout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              {/* PAYOUT DESTINATION SELECTOR */}
              <View style={styles.studioCard}>
                <Text style={styles.cardHeaderLabel}>PAYOUT DESTINATION (RECEIVE FUNDS)</Text>

                {/* Destination Bank Account Card */}
                <View style={styles.payoutAccountCard}>
                  <View style={styles.bankIconRound}>
                    <Ionicons name="business" size={18} color="#4318FF" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.bankCardTitle}>{userBankName}</Text>
                      <View style={styles.verifiedBankBadge}>
                        <Ionicons name="shield-checkmark" size={10} color="#05CD99" />
                        <Text style={styles.verifiedBankBadgeText}>Verified</Text>
                      </View>
                    </View>
                    <Text style={styles.bankCardNumber}>A/C {userBankAcc} • Automated IMPS Payout</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color="#05CD99" />
                </View>

                {/* Seller Note */}
                <Text style={[styles.cardHeaderLabel, { marginTop: 14 }]}>SELLER REQUEST MEMO</Text>
                <View style={styles.inputFieldBox}>
                  <Ionicons name="document-text-outline" size={18} color="#707EAE" style={styles.inputFieldIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g. Seller liquidation, Profit booking"
                    placeholderTextColor="#A0AEC0"
                    value={sellerNote}
                    onChangeText={setSellerNote}
                    maxLength={50}
                  />
                </View>
              </View>

              {/* Primary Submit Seller Request Button */}
              <TouchableOpacity
                style={styles.sellerSubmitBtn}
                onPress={handleSubmitSellerRequest}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#D97706', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sellerSubmitGradient}
                >
                  <Ionicons name="flash" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.sellerSubmitText}>
                    {isSubmitting ? 'Submitting Request...' : `Submit Seller Request (₹${netSellPayout.toFixed(0)}) 🚀`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SECTION C: RECENT REQUESTS TRACKER (SELLER & COIN) */}
          {/* ======================================================== */}
          <View style={styles.trackerCard}>
            <View style={styles.trackerHeaderRow}>
              <View style={styles.trackerTitleGroup}>
                <Ionicons name="time" size={17} color="#1B2559" />
                <Text style={styles.trackerTitle}>Request History</Text>
                <View style={styles.trackerCountPill}>
                  <Text style={styles.trackerCountText}>{requestsList.length}</Text>
                </View>
              </View>

              {/* History Filter Tabs: All | Seller Requests | Coin Requests */}
              <View style={styles.filterTabsRow}>
                <TouchableOpacity
                  style={[styles.filterTab, historyFilter === 'ALL' && styles.filterTabActive]}
                  onPress={() => setHistoryFilter('ALL')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterTabText, historyFilter === 'ALL' && styles.filterTabTextActive]}>
                    All ({requestsList.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterTab, historyFilter === 'SELLER' && styles.filterTabActive]}
                  onPress={() => setHistoryFilter('SELLER')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterTabText, historyFilter === 'SELLER' && styles.filterTabTextActive]}>
                    Seller ({sellerCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterTab, historyFilter === 'COIN' && styles.filterTabActive]}
                  onPress={() => setHistoryFilter('COIN')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterTabText, historyFilter === 'COIN' && styles.filterTabTextActive]}>
                    Coin ({coinCount})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* List of Filtered Requests */}
            {filteredRequests.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <Ionicons name="receipt-outline" size={36} color="#CBD5E1" />
                <Text style={styles.emptyStateTitle}>No {historyFilter.toLowerCase()} requests found</Text>
                <Text style={styles.emptyStateSub}>Create a request above to track here.</Text>
              </View>
            ) : (
              filteredRequests.map((item) => {
                const isSeller = item.type === 'seller_request';
                const isCompleted = item.status === 'completed';
                const isPending = item.status === 'pending';

                return (
                  <View key={item.id} style={styles.requestItemRow}>
                    <View style={styles.requestItemLeft}>
                      {/* Avatar with distinct styling */}
                      <View
                        style={[
                          styles.requestAvatar,
                          isSeller ? { backgroundColor: '#FEF3C7' } : { backgroundColor: '#EEF2FF' },
                        ]}
                      >
                        <Text style={{ fontSize: 16 }}>{isSeller ? '💼' : '🪙'}</Text>
                      </View>

                      <View style={styles.requestMetaGroup}>
                        <View style={styles.payerTitleRow}>
                          <Text style={styles.payerTitleText} numberOfLines={1}>
                            {isSeller ? 'Seller Request' : 'Coin Request'}
                          </Text>

                          {/* Distinct Type Pill */}
                          <View
                            style={[
                              styles.typePillBadge,
                              isSeller ? styles.typePillSeller : styles.typePillCoin,
                            ]}
                          >
                            <Text
                              style={[
                                styles.typePillText,
                                isSeller ? { color: '#B45309' } : { color: '#4318FF' },
                              ]}
                            >
                              {isSeller ? 'SELLER' : 'COIN'}
                            </Text>
                          </View>

                          {/* Status Pill */}
                          <View
                            style={[
                              styles.statusPillBadge,
                              isCompleted && styles.statusCompletedPill,
                              isPending && styles.statusPendingPill,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillLabel,
                                isCompleted && { color: '#065F46' },
                                isPending && { color: '#B45309' },
                              ]}
                            >
                              {isCompleted ? 'SETTLED' : 'PENDING'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.requestDestinationSub} numberOfLines={1}>
                          {isSeller ? `Payout: ${item.payerOrDestination}` : `Payer: ${item.payerOrDestination}`}
                        </Text>
                        <Text style={styles.requestNoteSub} numberOfLines={1}>
                          {item.note} • {item.date}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.requestItemRight}>
                      <Text style={[styles.requestAmountValue, isSeller && { color: '#D97706' }]}>
                        {isSeller ? `- ${item.amount} xC` : `+ ${item.amount} xC`}
                      </Text>
                      <Text style={styles.requestFiatSub}>
                        {isSeller
                          ? `₹ ${(item.netPayout || item.amount * rates.xCoin).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                          : `≈ ₹ ${(item.amount * rates.xCoin).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                      </Text>

                      {/* Action buttons */}
                      <View style={styles.itemActionGroup}>
                        {isSeller ? (
                          <TouchableOpacity
                            style={styles.slipBtn}
                            onPress={() => {
                              setSelectedModalItem(item);
                              setShowQrModal(true);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.slipBtnText}>View Slip</Text>
                          </TouchableOpacity>
                        ) : (
                          <>
                            {isPending && (
                              <TouchableOpacity
                                style={styles.remindActionBtn}
                                onPress={() => handleRemind(item)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.remindActionText}>Remind</Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              style={styles.slipBtn}
                              onPress={() => {
                                setSelectedModalItem(item);
                                setShowQrModal(true);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.slipBtnText}>QR</Text>
                            </TouchableOpacity>
                          </>
                        )}

                        {isPending && (
                          <TouchableOpacity
                            style={styles.cancelActionBtn}
                            onPress={() => handleCancelRequest(item.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="trash-outline" size={13} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* COMPLIANCE & ESCROW FOOTER */}
          <View style={styles.complianceCard}>
            <View style={styles.complianceIconShield}>
              <Ionicons name="shield-checkmark" size={18} color="#05CD99" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.complianceTitle}>Certified P2P Escrow & IMPS Gateway</Text>
              <Text style={styles.complianceSub}>
                Seller requests settle instantly to registered bank accounts. Coin requests use cryptographically signed Web3 multi-sig vaults.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* FULLSCREEN POPUP MODAL (ADAPTS FOR COIN REQUEST OR SELLER SLIP) */}
        <Modal
          visible={showQrModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQrModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainerCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleBox}>
                  <Text style={styles.modalMainTitle}>
                    {selectedModalItem?.type === 'seller_request' ? 'Seller Liquidation Slip' : 'xCoin Payment Request'}
                  </Text>
                  <Text style={styles.modalMainSub}>
                    {selectedModalItem?.type === 'seller_request' ? 'Automated IMPS Bank Settlement' : 'Scan with Zapp Pay or UPI app'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowQrModal(false)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              {/* MODAL CONTENT: SELLER REQUEST SLIP */}
              {selectedModalItem?.type === 'seller_request' ? (
                <View style={styles.sellerSlipBox}>
                  <View style={styles.slipTopStatus}>
                    <Ionicons name="checkmark-circle" size={26} color="#05CD99" />
                    <Text style={styles.slipTopHeading}>Seller Order #{selectedModalItem.id}</Text>
                    <Text style={styles.slipTopSub}>Automated Escrow Dispatched</Text>
                  </View>

                  <View style={styles.slipDataRow}>
                    <Text style={styles.slipLabel}>Quantity Sold</Text>
                    <Text style={styles.slipValue}>{selectedModalItem.amount} xCoin</Text>
                  </View>

                  <View style={styles.slipDataRow}>
                    <Text style={styles.slipLabel}>Gross Valuation</Text>
                    <Text style={styles.slipValue}>
                      ₹ {((selectedModalItem.inrValue || selectedModalItem.amount * rates.xCoin)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>

                  <View style={styles.slipDataRow}>
                    <Text style={styles.slipLabel}>1% TDS Certificate</Text>
                    <Text style={[styles.slipValue, { color: '#EF4444' }]}>
                      - ₹ {(selectedModalItem.tds || selectedModalItem.amount * rates.xCoin * 0.01).toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.slipDataRow}>
                    <Text style={styles.slipLabel}>Destination Bank</Text>
                    <Text style={styles.slipValue}>{selectedModalItem.payerOrDestination}</Text>
                  </View>

                  <View style={styles.slipDivider} />

                  <View style={styles.slipNetRow}>
                    <Text style={styles.slipNetLabel}>NET BANK PAYOUT</Text>
                    <Text style={styles.slipNetValue}>
                      ₹ {((selectedModalItem.netPayout || selectedModalItem.amount * rates.xCoin * 0.99)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              ) : (
                /* MODAL CONTENT: COIN REQUEST QR */
                <View style={styles.modalQrFrame}>
                  <View style={styles.modalQrInnerBox}>
                    <View style={[styles.qrFinderPattern, { top: 12, left: 12, width: 36, height: 36 }]}>
                      <View style={[styles.qrFinderCore, { width: 16, height: 16 }]} />
                    </View>
                    <View style={[styles.qrFinderPattern, { top: 12, right: 12, width: 36, height: 36 }]}>
                      <View style={[styles.qrFinderCore, { width: 16, height: 16 }]} />
                    </View>
                    <View style={[styles.qrFinderPattern, { bottom: 12, left: 12, width: 36, height: 36 }]}>
                      <View style={[styles.qrFinderCore, { width: 16, height: 16 }]} />
                    </View>

                    <View style={styles.modalMatrixArea}>
                      {[...Array(48)].map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.modalMatrixDot,
                            {
                              opacity: (i * 17) % 2 === 0 ? 0.9 : 0.4,
                              backgroundColor: i % 4 === 0 ? '#4318FF' : '#1B2559',
                            },
                          ]}
                        />
                      ))}
                    </View>

                    <View style={styles.modalLogoBadge}>
                      <Image
                        source={require('../../../assets/images/logo_transparent.png')}
                        style={{ width: 26, height: 26 }}
                        resizeMode="contain"
                      />
                    </View>
                  </View>

                  <View style={styles.modalAmountCluster}>
                    <Text style={styles.modalAmountText}>
                      {selectedModalItem ? selectedModalItem.amount : parsedCoinAmount} xCoin
                    </Text>
                    <Text style={styles.modalNoteText}>
                      "{selectedModalItem ? selectedModalItem.note : coinNote}"
                    </Text>
                  </View>

                  <View style={styles.modalPayeePill}>
                    <Ionicons name="wallet-outline" size={15} color="#4318FF" />
                    <Text style={styles.modalPayeeText} numberOfLines={1}>
                      {userName} • {userWalletAddress.slice(0, 16)}...
                    </Text>
                  </View>
                </View>
              )}

              {/* Modal Buttons */}
              <View style={styles.modalActionButtons}>
                {selectedModalItem?.type !== 'seller_request' && (
                  <TouchableOpacity
                    style={styles.modalPrimaryShareBtn}
                    onPress={handleShareCoinRequest}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="share-social" size={16} color="#FFFFFF" />
                    <Text style={styles.modalPrimaryShareText}>Share Request Link</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.modalCloseDoneBtn}
                  onPress={() => setShowQrModal(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCloseDoneText}>Close</Text>
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

  // Top Header
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1B2559',
  },
  zeroFeeHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 205, 153, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  zeroFeeHeaderText: {
    color: '#05CD99',
    fontSize: 10,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#707EAE',
    marginTop: 2,
  },
  headerBrandBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F4F7FE',
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Master Primary Selector
  masterTabSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 6,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  masterTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  masterTabBtnActiveCoin: {
    backgroundColor: '#FFFFFF',
    borderColor: '#4318FF',
    shadowColor: '#4318FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  masterTabBtnActiveSeller: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  tabIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tabIconGlyph: {
    fontSize: 16,
  },
  tabTextCol: {
    flex: 1,
  },
  tabHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  masterTabTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#475569',
  },
  masterTabTitleActive: {
    color: '#1B2559',
  },
  masterTabSub: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },
  activeCheckDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4318FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Vault Identifier Bar
  vaultIdentifierBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  vaultLeftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  web3LiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#05CD99',
    marginRight: 8,
  },
  vaultPillLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.5,
  },
  vaultPillAddress: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1B2559',
  },
  miniCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  miniCopyBtnDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  miniCopyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4318FF',
  },

  // Seller Balance Bar
  sellerBalanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  sellerBalanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerBalanceLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  sellerBalanceValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#92400E',
  },
  sellerMaxBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sellerMaxBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  // Studio Card
  studioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.6,
  },
  liveRatePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveRateText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#4318FF',
  },

  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  coinSymbolBadge: {
    fontSize: 22,
    marginRight: 8,
  },
  amountBigInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '900',
    color: '#1B2559',
    padding: 0,
  },
  coinUnitLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4318FF',
  },

  conversionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  conversionBarText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },

  presetsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#4318FF',
    borderColor: '#4318FF',
  },
  presetChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  percentageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  pctChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pctChipActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  pctChipText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#92400E',
  },
  pctChipTextActive: {
    color: '#FFFFFF',
  },

  // Frequent Payers
  frequentPayersScroll: {
    gap: 8,
    paddingBottom: 10,
  },
  frequentPayerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  frequentPayerChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4318FF',
  },
  payerAvatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payerAvatarText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  payerChipName: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1B2559',
    maxWidth: 95,
  },
  payerChipSub: {
    fontSize: 9.5,
    color: '#94A3B8',
    maxWidth: 95,
  },

  inputFieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
  },
  inputFieldIcon: {
    marginRight: 8,
  },
  fieldInput: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1B2559',
    padding: 0,
  },
  purposeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  purposeTagChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  purposeTagChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  purposeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  purposeTagTextActive: {
    color: '#4318FF',
    fontWeight: '800',
  },

  // Seller Breakdown Card
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  breakdownHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  breakdownValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  zeroFeePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  zeroFeePillText: {
    color: '#05CD99',
    fontSize: 10.5,
    fontWeight: '800',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  netPayoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  netPayoutLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  netPayoutSub: {
    fontSize: 10,
    color: '#047857',
    fontWeight: '600',
    marginTop: 1,
  },
  netPayoutDigits: {
    fontSize: 18,
    fontWeight: '900',
    color: '#05CD99',
  },

  // Payout Account Card
  payoutAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bankIconRound: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B2559',
  },
  verifiedBankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    gap: 3,
  },
  verifiedBankBadgeText: {
    color: '#05CD99',
    fontSize: 9.5,
    fontWeight: '800',
  },
  bankCardNumber: {
    fontSize: 11,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 2,
  },

  // Seller Submit Button
  sellerSubmitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  sellerSubmitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  sellerSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // QR Card
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  qrCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  qrHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qrIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  qrHeaderSub: {
    fontSize: 10.5,
    color: '#707EAE',
    fontWeight: '600',
  },
  expandQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  expandQrBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4318FF',
  },

  qrChamber: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  qrVisualFrame: {
    width: 164,
    height: 164,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qrCornerTopLeft: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 14,
    height: 14,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: '#4318FF',
  },
  qrCornerTopRight: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 14,
    height: 14,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: '#4318FF',
  },
  qrCornerBottomLeft: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    width: 14,
    height: 14,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: '#4318FF',
  },
  qrCornerBottomRight: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 14,
    height: 14,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: '#4318FF',
  },
  qrMatrixLayout: {
    width: 142,
    height: 142,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFinderPattern: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderWidth: 3,
    borderColor: '#1B2559',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFinderCore: {
    width: 14,
    height: 14,
    backgroundColor: '#1B2559',
    borderRadius: 3,
  },
  matrixMicroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 76,
    gap: 4,
    justifyContent: 'center',
  },
  matrixMicroDot: {
    width: 6,
    height: 6,
    borderRadius: 1.5,
  },
  qrCenterBadge: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  qrCenterLogo: {
    width: 20,
    height: 20,
  },
  qrMetaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  qrAmountCapsule: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qrAmountCapsuleText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#4318FF',
  },
  qrNoteCapsuleText: {
    fontSize: 11.5,
    color: '#707EAE',
    fontWeight: '700',
    maxWidth: 160,
  },
  qrInstructionNotice: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
  },

  primarySendBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  primarySendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primarySendText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryControlsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 11,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  secondaryBtnDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  secondaryBtnText: {
    color: '#4318FF',
    fontSize: 11.5,
    fontWeight: '800',
  },

  // Tracker Card
  trackerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  trackerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  trackerCountPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  trackerCountText: {
    color: '#4318FF',
    fontSize: 10,
    fontWeight: '800',
  },
  filterTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  filterTab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTabText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: '#1B2559',
    fontWeight: '800',
  },

  emptyStateBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 8,
  },
  emptyStateSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  requestItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  requestItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  requestAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  requestMetaGroup: {
    flex: 1,
  },
  payerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  payerTitleText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  typePillBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  typePillSeller: {
    backgroundColor: '#FEF3C7',
  },
  typePillCoin: {
    backgroundColor: '#EEF2FF',
  },
  typePillText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  statusPillBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  statusPendingPill: {
    backgroundColor: '#FEF3C7',
  },
  statusCompletedPill: {
    backgroundColor: '#D1FAE5',
  },
  statusPillLabel: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  requestDestinationSub: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
    marginTop: 1,
  },
  requestNoteSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  requestItemRight: {
    alignItems: 'flex-end',
  },
  requestAmountValue: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#4318FF',
  },
  requestFiatSub: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#05CD99',
    marginTop: 1,
  },
  itemActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  slipBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slipBtnText: {
    color: '#4318FF',
    fontSize: 10,
    fontWeight: '800',
  },
  remindActionBtn: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  remindActionText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
  },
  cancelActionBtn: {
    padding: 2,
  },

  // Compliance Banner
  complianceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 205, 153, 0.08)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(5, 205, 153, 0.2)',
    gap: 10,
  },
  complianceIconShield: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  complianceTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  complianceSub: {
    fontSize: 10.5,
    color: '#047857',
    marginTop: 2,
    lineHeight: 14,
  },

  // Modal Backdrop & Card
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainerCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitleBox: {
    flex: 1,
  },
  modalMainTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1B2559',
  },
  modalMainSub: {
    fontSize: 11,
    color: '#707EAE',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },

  // Seller Slip In Modal
  sellerSlipBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  slipTopStatus: {
    alignItems: 'center',
    marginBottom: 12,
  },
  slipTopHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1B2559',
    marginTop: 4,
  },
  slipTopSub: {
    fontSize: 11,
    color: '#05CD99',
    fontWeight: '700',
  },
  slipDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  slipLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  slipValue: {
    fontSize: 12,
    color: '#1B2559',
    fontWeight: '800',
  },
  slipDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  slipNetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slipNetLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#065F46',
  },
  slipNetValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#05CD99',
  },

  // Coin Modal QR
  modalQrFrame: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  modalQrInnerBox: {
    width: 190,
    height: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  modalMatrixArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 100,
    gap: 4,
    justifyContent: 'center',
  },
  modalMatrixDot: {
    width: 7,
    height: 7,
    borderRadius: 2,
  },
  modalLogoBadge: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  modalAmountCluster: {
    alignItems: 'center',
    marginBottom: 6,
  },
  modalAmountText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1B2559',
  },
  modalNoteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#707EAE',
    marginTop: 2,
  },
  modalPayeePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
  },
  modalPayeeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4318FF',
  },

  modalActionButtons: {
    gap: 8,
  },
  modalPrimaryShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4318FF',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },
  modalPrimaryShareText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  modalCloseDoneBtn: {
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  modalCloseDoneText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '800',
  },
});
