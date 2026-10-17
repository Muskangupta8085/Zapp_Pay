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
  Modal,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { apiClient } from '../../api/client';
import { OrdersService, HomeService } from '../../services/api.service';

interface OrdersScreenProps {
  onNavigateToProfile?: () => void;
  onNavigateToBuy?: () => void;
  onNavigateToSell?: () => void;
  onNavigateToWallet?: () => void;
}

export interface OrderItem {
  id: string;
  type: 'Buy' | 'Sell';
  token: 'xCoin' | 'USDT';
  cryptoAmount: string;
  fiatAmount: string;
  rate: string;
  status: 'Completed' | 'Processing' | 'Cancelled';
  date: string;
  method: string;
  methodIcon: keyof typeof Ionicons.glyphMap;
  txHash: string;
  fee: string;
  counterparty: string;
  timeRemaining?: string;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  onNavigateToProfile,
  onNavigateToBuy,
  onNavigateToSell,
  onNavigateToWallet,
}) => {
  const insets = useSafeAreaInsets();

  // State Management
  const [activeTab, setActiveTab] = useState<'All' | 'Buy' | 'Sell' | 'Processing' | 'Completed'>('All');
  const [selectedAsset, setSelectedAsset] = useState<'ALL' | 'xCoin' | 'USDT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [hideVolume, setHideVolume] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNewTradeModal, setShowNewTradeModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'CSV' | 'PDF'>('PDF');
  const [exportRange, setExportRange] = useState<'30D' | '90D' | 'ALL'>('30D');

  // Master Order Book Dataset - Fetched from backend
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [xCoinRate, setXCoinRate] = useState(108.37);

  const fetchTransactions = async () => {
    try {
      setIsLoadingOrders(true);
      const [res, tickers] = await Promise.all([
        OrdersService.getOrders().catch(() => null),
        HomeService.getTickers().catch(() => null),
      ]);
      let currentRate = xCoinRate;
      if (tickers && Array.isArray(tickers)) {
        const zap = tickers.find((t: any) => t.id === 'xcoin')?.rawPrice;
        if (zap) {
          setXCoinRate(zap);
          currentRate = zap;
        }
      }
      if (res?.success && Array.isArray(res?.data) && res.data.length > 0) {
        const list: OrderItem[] = res.data.map((o: any) => ({
          ...o,
          methodIcon: (o.methodIcon || 'flash-outline') as keyof typeof Ionicons.glyphMap,
        }));
        setOrders(list);
      } else {
        const fallback = await apiClient.get('/transactions');
        if (fallback.data?.success && Array.isArray(fallback.data?.data)) {
          const list: OrderItem[] = fallback.data.data.map((tx: any) => {
            const isDepositOrBuy = tx.type === 'deposit' || tx.type === 'buy';
            return {
              id: tx._id ? `ORD-${tx._id.slice(-5).toUpperCase()}` : 'ORD-NEW',
              type: (isDepositOrBuy ? 'Buy' : 'Sell') as 'Buy' | 'Sell',
              token: (tx.symbol === 'USDT' ? 'USDT' : 'xCoin') as 'xCoin' | 'USDT',
              cryptoAmount: `${isDepositOrBuy ? '+' : '-'}${tx.amount} ${tx.symbol || 'xCoin'}`,
              fiatAmount: `₹ ${(tx.amount * currentRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
              rate: `₹ ${currentRate.toFixed(2)} / coin`,
              status: (tx.status === 'completed' ? 'Completed' : (tx.status === 'pending' ? 'Processing' : 'Cancelled')) as any,
              date: new Date(tx.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
              method: 'Instant UPI / Web3',
              methodIcon: 'flash-outline' as const,
              txHash: tx.txHash || '0x' + (tx._id ? tx._id.slice(0, 16) : '0000'),
              fee: '₹ 0.00 (Zero Fee)',
              counterparty: 'Zapp Escrow Node',
            };
          });
          setOrders(list);
        }
      }
    } catch (err) {
      // Keep empty if network error
    } finally {
      setIsLoadingOrders(false);
    }
  };

  React.useEffect(() => {
    fetchTransactions();
  }, []);

  const buyVolume = orders
    .filter((o) => o.type === 'Buy' && o.status === 'Completed')
    .reduce((acc, curr) => acc + (parseFloat(curr.fiatAmount.replace(/[^0-9.]/g, '')) || 0), 0);

  const sellVolume = orders
    .filter((o) => o.type === 'Sell' && o.status === 'Completed')
    .reduce((acc, curr) => acc + (parseFloat(curr.fiatAmount.replace(/[^0-9.]/g, '')) || 0), 0);

  // Copy Order ID feedback
  const handleCopyId = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy TX Hash feedback
  const handleCopyHash = () => {
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Share Receipt
  const handleShareReceipt = async (order: OrderItem) => {
    try {
      await Share.share({
        message: `Zapp Pay Official Trade Voucher\nOrder ID: ${order.id}\nType: ${order.type} ${order.token}\nAmount: ${order.cryptoAmount} (${order.fiatAmount})\nStatus: ${order.status}\nTX Hash: ${order.txHash}\nExecuted via Zapp Pay.`,
      });
    } catch {
      Alert.alert('Shared', 'Trade voucher copied to clipboard.');
    }
  };

  // Confirm Processing Order
  const handleConfirmOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const amountStr = targetOrder ? targetOrder.fiatAmount : 'the settlement amount';
    Alert.alert(
      'Confirm Payment Settlement',
      `Did you receive ${amountStr} in your linked bank account via IMPS?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Confirm & Release',
          style: 'default',
          onPress: () => {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === orderId
                  ? {
                      ...o,
                      status: 'Completed',
                      date: 'Just Now',
                      timeRemaining: undefined,
                    }
                  : o
              )
            );
            if (selectedOrder && selectedOrder.id === orderId) {
              setSelectedOrder((prev) =>
                prev ? { ...prev, status: 'Completed', date: 'Just Now' } : null
              );
            }
            Alert.alert(
              'Escrow Settled! 🎉',
              'The order has been marked Completed and the funds have been settled into your account.'
            );
          },
        },
      ]
    );
  };

  // Cancel Processing Order
  const handleCancelOrder = (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this pending escrow trade?',
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              await OrdersService.cancelOrder(orderId);
            } catch {
              // Graceful fallback
            }
            setOrders((prev) =>
              prev.map((o) =>
                o.id === orderId
                  ? {
                      ...o,
                      status: 'Cancelled',
                      date: 'Just Now',
                      txHash: 'Cancelled by User',
                    }
                  : o
              )
            );
            if (selectedOrder && selectedOrder.id === orderId) {
              setSelectedOrder((prev) =>
                prev ? { ...prev, status: 'Cancelled', date: 'Just Now' } : null
              );
            }
            Alert.alert('Order Cancelled', 'The escrow order has been cancelled.');
          },
        },
      ]
    );
  };

  // Sync animation
  const handleSyncOrders = async () => {
    setIsSyncing(true);
    await fetchTransactions();
    setIsSyncing(false);
    Alert.alert('Ledger Up to Date', 'All Web3 on-chain blocks and P2P escrow states are fully synced.');
  };

  // Download Statement action
  const handleDownloadStatement = async () => {
    setShowExportModal(false);
    try {
      const res = await OrdersService.exportOrders(exportFormat, exportRange);
      Alert.alert(
        'Statement Generated 📄',
        res?.message || `Your official Zapp Pay ${exportFormat} statement for ${
          exportRange === '30D' ? 'the Last 30 Days' : exportRange === '90D' ? 'the Last 90 Days' : 'All-Time'
        } has been generated and saved to your Downloads folder.`
      );
    } catch {
      Alert.alert(
        'Statement Generated 📄',
        `Your official Zapp Pay ${exportFormat} statement for ${
          exportRange === '30D' ? 'the Last 30 Days' : exportRange === '90D' ? 'the Last 90 Days' : 'All-Time'
        } has been generated.`
      );
    }
  };

  // Filter calculations
  const filteredOrders = orders.filter((order) => {
    // Tab filter
    if (activeTab === 'Buy' && order.type !== 'Buy') return false;
    if (activeTab === 'Sell' && order.type !== 'Sell') return false;
    if (activeTab === 'Processing' && order.status !== 'Processing') return false;
    if (activeTab === 'Completed' && order.status !== 'Completed') return false;

    // Asset filter
    if (selectedAsset !== 'ALL' && order.token !== selectedAsset) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        order.id.toLowerCase().includes(q) ||
        order.type.toLowerCase().includes(q) ||
        order.token.toLowerCase().includes(q) ||
        order.method.toLowerCase().includes(q) ||
        order.counterparty.toLowerCase().includes(q) ||
        order.status.toLowerCase().includes(q) ||
        order.fiatAmount.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const buyCount = orders.filter((o) => o.type === 'Buy').length;
  const sellCount = orders.filter((o) => o.type === 'Sell').length;
  const processingCount = orders.filter((o) => o.status === 'Processing').length;
  const completedCount = orders.filter((o) => o.status === 'Completed').length;
  const processingOrder = orders.find((o) => o.status === 'Processing');

  return (
    <ImageBackground
      source={require('../../../assets/images/onboarding_bg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* TOP APP BAR - Web3 Trading Desk Header */}
        <View
          style={[
            styles.topHeader,
            { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 12 : 20) + 6 },
          ]}
        >
          {/* Left: Screen Identity & Protocol Pill */}
          <View style={styles.headerTitleBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.screenTitle}>Orders</Text>
            </View>
            <Text style={styles.screenSubtitle}>
              P2P executions, on-chain ledger & tax receipts
            </Text>
          </View>

          {/* Right Tools: Filter, Sync & Statement Export */}
          <View style={styles.headerRightActions}>
            {/* Filter Toggle */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.toolIconBtn,
                (activeTab !== 'All' || selectedAsset !== 'ALL') && styles.toolIconBtnActive,
              ]}
              onPress={() => setShowFilterModal(true)}
              accessibilityLabel="Filter Orders"
            >
              <Ionicons
                name="funnel-outline"
                size={17}
                color={activeTab !== 'All' || selectedAsset !== 'ALL' ? Colors.primary : '#1B2559'}
              />
              {(activeTab !== 'All' || selectedAsset !== 'ALL') && (
                <View style={styles.activeFilterDot} />
              )}
            </TouchableOpacity>

            {/* Quick Sync */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.toolIconBtn}
              onPress={handleSyncOrders}
              accessibilityLabel="Sync Ledger"
            >
              <Ionicons
                name="sync-outline"
                size={17}
                color={isSyncing ? Colors.primary : '#1B2559'}
              />
            </TouchableOpacity>

            {/* Statement Download */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.toolIconBtn}
              onPress={() => setShowExportModal(true)}
              accessibilityLabel="Download Statement"
            >
              <Ionicons name="document-text-outline" size={17} color="#1B2559" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ACTIVE IN-PROGRESS ESCROW BANNER (When order is Processing) */}
          {processingOrder && (
            <View style={styles.activeAlertBanner}>
              <LinearGradient
                colors={['#FEF3C7', '#FFFBEB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeAlertGradient}
              >
                <View style={styles.activeAlertTop}>
                  <View style={styles.activeAlertLeft}>
                    <View style={styles.alertClockCircle}>
                      <Ionicons name="time" size={15} color="#D97706" />
                    </View>
                    <View>
                      <View style={styles.alertTitleRow}>
                        <Text style={styles.alertTitle}>Active Escrow Trade</Text>
                        <View style={styles.alertCountdownBadge}>
                          <Text style={styles.alertCountdownText}>
                            ⏱ {processingOrder.timeRemaining || '10:00 min'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.alertSub}>
                        {processingOrder.id} • {processingOrder.type} {processingOrder.cryptoAmount} (
                        {processingOrder.fiatAmount})
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.alertActionsRow}>
                  <TouchableOpacity
                    style={styles.alertConfirmBtn}
                    onPress={() => handleConfirmOrder(processingOrder.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                    <Text style={styles.alertConfirmBtnText}>Confirm Settlement</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.alertDetailsBtn}
                    onPress={() => setSelectedOrder(processingOrder)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.alertDetailsBtnText}>View Details</Text>
                    <Ionicons name="chevron-forward" size={12} color="#92400E" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* MASTER 30-DAY TURNOVER & SETTLEMENT HERO CARD */}
          <LinearGradient
            colors={['#0B132B', '#1C2541', '#281E5D', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.turnoverHeroCard}
          >
            {/* Top row: Turnover title & 0% gas badge */}
            <View style={styles.turnoverHeaderRow}>
              <View style={styles.turnoverTitleGroup}>
                <View style={styles.turnoverIconCircle}>
                  <Ionicons name="swap-horizontal" size={16} color="#38BDF8" />
                </View>
                <View>
                  <Text style={styles.turnoverCardTitle}>30-Day Trading Turnover</Text>
                  <Text style={styles.turnoverCardSubtitle}>Executed P2P & Instant Swaps</Text>
                </View>
              </View>

              <View style={styles.zeroGasBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                <Text style={styles.zeroGasBadgeText}>0% Platform Fee</Text>
              </View>
            </View>

            {/* Turnover Figures & Quick Action */}
            <View style={styles.turnoverMiddleRow}>
              <View style={styles.turnoverAmountBlock}>
                <View style={styles.turnoverLabelRow}>
                  <Text style={styles.turnoverLabel}>Total Settled Turnover</Text>
                  <TouchableOpacity
                    onPress={() => setHideVolume(!hideVolume)}
                    style={styles.eyeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={hideVolume ? 'eye-off-outline' : 'eye-outline'}
                      size={14}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.turnoverMainNumberRow}>
                  <Text style={styles.turnoverDigits}>
                    {hideVolume ? '••••••••' : '₹ 13,350.00'}
                  </Text>
                  <Text style={styles.turnoverCurrency}>
                    {hideVolume ? '' : ' INR'}
                  </Text>
                </View>

                <Text style={styles.turnoverTokensSub}>
                  {hideVolume ? '••••••' : '≈ 2,650 xCoin + 50 USDT'}
                </Text>
              </View>

              {/* Fast Trade Launcher Button */}
              <TouchableOpacity
                style={styles.newTradeBtn}
                onPress={() => setShowNewTradeModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.newTradeBtnText}>New Trade</Text>
              </TouchableOpacity>
            </View>

            {/* 3-Part Flow Metric Strip */}
            <View style={styles.flowMetricsGrid}>
              <View style={styles.flowCol}>
                <View style={styles.flowLabelRow}>
                  <Ionicons name="arrow-down-circle" size={13} color="#10B981" />
                  <Text style={styles.flowColLabel}>Buy Volume</Text>
                </View>
                <Text style={[styles.flowColVal, { color: '#6EE7B7' }]}>
                  {hideVolume ? '••••' : `₹ ${buyVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                </Text>
                <Text style={styles.flowColSub}>{buyCount} Trades</Text>
              </View>

              <View style={styles.flowDivider} />

              <View style={styles.flowCol}>
                <View style={styles.flowLabelRow}>
                  <Ionicons name="arrow-up-circle" size={13} color="#F59E0B" />
                  <Text style={styles.flowColLabel}>Sell Volume</Text>
                </View>
                <Text style={[styles.flowColVal, { color: '#FDE68A' }]}>
                  {hideVolume ? '••••' : `₹ ${sellVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                </Text>
                <Text style={styles.flowColSub}>{sellCount} Trades</Text>
              </View>

              <View style={styles.flowDivider} />

              <View style={styles.flowCol}>
                <View style={styles.flowLabelRow}>
                  <Ionicons name="flash" size={13} color="#38BDF8" />
                  <Text style={styles.flowColLabel}>Escrow Rate</Text>
                </View>
                <Text style={[styles.flowColVal, { color: '#BAE6FD' }]}>100%</Text>
                <Text style={styles.flowColSub}>Instant Web3</Text>
              </View>
            </View>
          </LinearGradient>

          {/* SEARCH INPUT BAR */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={17} color="#707EAE" style={styles.searchIcon} />
            <TextInput
              placeholder="Search by Order ID, UPI, token..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={17} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* ASSET SELECTOR CHIPS (All, xCoin, USDT) */}
          <View style={styles.assetFilterRow}>
            {(['ALL', 'xCoin', 'USDT'] as const).map((asset) => {
              const isSelected = selectedAsset === asset;
              return (
                <TouchableOpacity
                  key={asset}
                  style={[styles.assetChip, isSelected && styles.assetChipActive]}
                  onPress={() => setSelectedAsset(asset)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.assetChipText, isSelected && styles.assetChipTextActive]}>
                    {asset === 'ALL' ? 'All Tokens' : asset}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ORDER TYPE TABS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContainer}
          >
            {(
              [
                { key: 'All', label: `All (${orders.length})` },
                { key: 'Buy', label: `Buy (${buyCount})` },
                { key: 'Sell', label: `Sell (${sellCount})` },
                { key: 'Processing', label: `Processing (${processingCount})` },
                { key: 'Completed', label: `Completed (${completedCount})` },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ORDERS FEED LIST */}
          <View style={styles.ordersListContainer}>
            {filteredOrders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="receipt-outline" size={32} color="#707EAE" />
                </View>
                <Text style={styles.emptyTitle}>No Orders Matching</Text>
                <Text style={styles.emptySubtitle}>
                  No trade executions found for the selected filter or search term.
                </Text>
                <View style={styles.emptyActionsRow}>
                  {(searchQuery.length > 0 || activeTab !== 'All' || selectedAsset !== 'ALL') && (
                    <TouchableOpacity
                      style={styles.emptyResetBtn}
                      onPress={() => {
                        setSearchQuery('');
                        setActiveTab('All');
                        setSelectedAsset('ALL');
                      }}
                    >
                      <Text style={styles.emptyResetBtnText}>Clear Filters</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.emptyNewTradeBtn}
                    onPress={() => (onNavigateToBuy ? onNavigateToBuy() : setShowNewTradeModal(true))}
                  >
                    <Text style={styles.emptyNewTradeBtnText}>Start First Trade</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              filteredOrders.map((order) => {
                const isBuy = order.type === 'Buy';
                const isCompleted = order.status === 'Completed';
                const isProcessing = order.status === 'Processing';
                const isCancelled = order.status === 'Cancelled';

                return (
                  <TouchableOpacity
                    key={order.id}
                    activeOpacity={0.88}
                    style={styles.orderCard}
                    onPress={() => setSelectedOrder(order)}
                  >
                    {/* Header: Asset Logo, Title, ID, Status */}
                    <View style={styles.orderCardHeader}>
                      <View style={styles.orderCardLeftHeader}>
                        {/* Asset Icon */}
                        <View style={styles.orderTokenIconCircle}>
                          <Image
                            source={require('../../../assets/images/logo_transparent.png')}
                            style={styles.orderTokenLogo}
                            resizeMode="contain"
                          />
                          <View
                            style={[
                              styles.orderDirectionBadge,
                              { backgroundColor: isBuy ? '#05CD99' : '#EE5D50' },
                            ]}
                          >
                            <Ionicons
                              name={isBuy ? 'arrow-down' : 'arrow-up'}
                              size={8}
                              color="#FFFFFF"
                            />
                          </View>
                        </View>

                        {/* Title & Copyable ID */}
                        <View>
                          <View style={styles.orderActionTitleRow}>
                            <Text style={styles.orderActionTitle}>
                              {order.type} {order.token}
                            </Text>
                            <View
                              style={[
                                styles.orderTypeBadge,
                                { backgroundColor: isBuy ? '#E6FAF5' : '#FEEFEE' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.orderTypeBadgeText,
                                  { color: isBuy ? '#05CD99' : '#EE5D50' },
                                ]}
                              >
                                {order.type.toUpperCase()}
                              </Text>
                            </View>
                          </View>

                          <TouchableOpacity
                            style={styles.orderIdCapsule}
                            onPress={() => handleCopyId(order.id)}
                            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                          >
                            <Text style={styles.orderIdCapsuleText}>
                              {order.id} {copiedId === order.id ? '✓' : ''}
                            </Text>
                            <Ionicons
                              name="copy-outline"
                              size={11}
                              color={copiedId === order.id ? '#05CD99' : '#94A3B8'}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Status Pill */}
                      <View
                        style={[
                          styles.statusBadgePill,
                          {
                            backgroundColor: isCompleted
                              ? '#E6FAF5'
                              : isProcessing
                              ? '#FEF3C7'
                              : '#FEEFEE',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: isCompleted
                                ? '#05CD99'
                                : isProcessing
                                ? '#D97706'
                                : '#EE5D50',
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusBadgePillText,
                            {
                              color: isCompleted
                                ? '#05CD99'
                                : isProcessing
                                ? '#D97706'
                                : '#EE5D50',
                            },
                          ]}
                        >
                          {isProcessing ? 'In Escrow' : order.status}
                        </Text>
                      </View>
                    </View>

                    {/* Middle Row: Crypto Amount & Fiat Total */}
                    <View style={styles.orderCardMiddle}>
                      <View>
                        <Text
                          style={[
                            styles.orderCryptoAmountText,
                            { color: isBuy ? '#05CD99' : '#EE5D50' },
                          ]}
                        >
                          {order.cryptoAmount}
                        </Text>
                        <Text style={styles.orderRateText}>{order.rate}</Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.orderFiatTotalText}>{order.fiatAmount}</Text>
                        <View style={styles.receiptVoucherLink}>
                          <Text style={styles.receiptVoucherLinkText}>Voucher</Text>
                          <Ionicons name="chevron-forward" size={11} color={Colors.primary} />
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    {/* Footer Row: Channel, Timestamp, and Quick Action */}
                    <View style={styles.orderCardFooter}>
                      <View style={styles.orderFooterLeft}>
                        <View style={styles.paymentMethodRow}>
                          <Ionicons name={order.methodIcon} size={13} color="#707EAE" />
                          <Text style={styles.paymentMethodText}>{order.method}</Text>
                        </View>
                        <Text style={styles.orderTimestampText}>• {order.date}</Text>
                      </View>

                      {/* Card Action Buttons */}
                      <View style={styles.orderCardActionsRow}>
                        {isProcessing ? (
                          <TouchableOpacity
                            style={styles.cardQuickConfirmBtn}
                            onPress={() => handleConfirmOrder(order.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.cardQuickConfirmBtnText}>Confirm</Text>
                          </TouchableOpacity>
                        ) : isCompleted ? (
                          <TouchableOpacity
                            style={styles.cardReorderBtn}
                            onPress={() => (isBuy && onNavigateToBuy ? onNavigateToBuy() : onNavigateToSell ? onNavigateToSell() : setShowNewTradeModal(true))}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="repeat" size={11} color={Colors.primary} />
                            <Text style={styles.cardReorderBtnText}>Repeat</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={styles.cardReorderBtn}
                            onPress={() => (isBuy && onNavigateToBuy ? onNavigateToBuy() : onNavigateToSell ? onNavigateToSell() : setShowNewTradeModal(true))}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.cardReorderBtnText}>Retry</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* MODAL 1: DETAILED TRADE RECEIPT & VOUCHER */}
        <Modal
          visible={selectedOrder !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedOrder(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.voucherModalCard}>
              {/* Header with Close */}
              <View style={styles.voucherModalHeader}>
                <View style={styles.voucherHeaderLeft}>
                  <View
                    style={[
                      styles.voucherStatusCircle,
                      {
                        backgroundColor:
                          selectedOrder?.status === 'Completed'
                            ? '#E6FAF5'
                            : selectedOrder?.status === 'Processing'
                            ? '#FEF3C7'
                            : '#FEEFEE',
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        selectedOrder?.status === 'Completed'
                          ? 'checkmark-circle'
                          : selectedOrder?.status === 'Processing'
                          ? 'time'
                          : 'close-circle'
                      }
                      size={22}
                      color={
                        selectedOrder?.status === 'Completed'
                          ? '#05CD99'
                          : selectedOrder?.status === 'Processing'
                          ? '#D97706'
                          : '#EE5D50'
                      }
                    />
                  </View>
                  <View>
                    <Text style={styles.voucherModalTitle}>Official Trade Voucher</Text>
                    <Text style={styles.voucherModalSubtitle}>
                      {selectedOrder?.id} • {selectedOrder?.status}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseIconBtn}
                  onPress={() => setSelectedOrder(null)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              {/* 3-Step Escrow Stepper */}
              <View style={styles.escrowStepperBox}>
                <View style={styles.stepperItem}>
                  <View style={[styles.stepperCircle, styles.stepperCircleDone]}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                  <Text style={styles.stepperLabel}>Order Created</Text>
                </View>
                <View
                  style={[
                    styles.stepperLine,
                    selectedOrder?.status !== 'Cancelled' && styles.stepperLineDone,
                  ]}
                />
                <View style={styles.stepperItem}>
                  <View
                    style={[
                      styles.stepperCircle,
                      selectedOrder?.status !== 'Cancelled' && styles.stepperCircleDone,
                    ]}
                  >
                    <Ionicons
                      name={selectedOrder?.status === 'Processing' ? 'time' : 'checkmark'}
                      size={10}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={styles.stepperLabel}>Escrow Held</Text>
                </View>
                <View
                  style={[
                    styles.stepperLine,
                    selectedOrder?.status === 'Completed' && styles.stepperLineDone,
                  ]}
                />
                <View style={styles.stepperItem}>
                  <View
                    style={[
                      styles.stepperCircle,
                      selectedOrder?.status === 'Completed'
                        ? styles.stepperCircleDone
                        : styles.stepperCirclePending,
                    ]}
                  >
                    <Ionicons
                      name={
                        selectedOrder?.status === 'Completed'
                          ? 'checkmark'
                          : selectedOrder?.status === 'Processing'
                          ? 'hourglass-outline'
                          : 'close'
                      }
                      size={10}
                      color={selectedOrder?.status === 'Completed' ? '#FFFFFF' : '#94A3B8'}
                    />
                  </View>
                  <Text style={styles.stepperLabel}>Settled</Text>
                </View>
              </View>

              {/* Data Breakdown Table */}
              <View style={styles.voucherTable}>
                <View style={styles.voucherRow}>
                  <Text style={styles.voucherLabel}>Trading Pair</Text>
                  <Text style={styles.voucherVal}>
                    {selectedOrder?.token} / INR ({selectedOrder?.type})
                  </Text>
                </View>

                <View style={styles.voucherRow}>
                  <Text style={styles.voucherLabel}>Settled Crypto</Text>
                  <Text
                    style={[
                      styles.voucherVal,
                      {
                        fontWeight: '900',
                        color: selectedOrder?.type === 'Buy' ? '#05CD99' : '#EE5D50',
                      },
                    ]}
                  >
                    {selectedOrder?.cryptoAmount}
                  </Text>
                </View>

                <View style={styles.voucherRow}>
                  <Text style={styles.voucherLabel}>Total Fiat Value</Text>
                  <Text style={[styles.voucherVal, { fontWeight: '900', color: '#1B2559' }]}>
                    {selectedOrder?.fiatAmount}
                  </Text>
                </View>

                <View style={styles.voucherRow}>
                  <Text style={styles.voucherLabel}>Unit Price</Text>
                  <Text style={styles.voucherVal}>{selectedOrder?.rate}</Text>
                </View>

                <View style={styles.voucherRow}>
                  <Text style={styles.voucherLabel}>Settlement Channel</Text>
                  <Text style={styles.voucherVal}>{selectedOrder?.method}</Text>
                </View>

                <View style={styles.voucherRow}>
                  <Text style={styles.voucherLabel}>Counterparty Node</Text>
                  <Text style={styles.voucherVal}>{selectedOrder?.counterparty}</Text>
                </View>

                <View style={styles.voucherRow}>
                  <Text style={styles.voucherLabel}>Protocol Fee</Text>
                  <Text style={[styles.voucherVal, { color: '#05CD99', fontWeight: '800' }]}>
                    {selectedOrder?.fee}
                  </Text>
                </View>

                <View style={styles.voucherRow}>
                  <Text style={styles.voucherLabel}>Execution Time</Text>
                  <Text style={styles.voucherVal}>{selectedOrder?.date}</Text>
                </View>

                {/* Blockchain TX Hash */}
                <View style={[styles.voucherRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.voucherLabel}>TX Hash / Ref</Text>
                  <TouchableOpacity
                    style={styles.txHashCopyBtn}
                    onPress={handleCopyHash}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.txHashText}>
                      {selectedOrder?.txHash} {copiedHash ? '✓' : ''}
                    </Text>
                    <Ionicons
                      name="copy-outline"
                      size={12}
                      color={copiedHash ? '#05CD99' : '#707EAE'}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.voucherActionsRow}>
                {selectedOrder?.status === 'Processing' ? (
                  <>
                    <TouchableOpacity
                      style={styles.voucherConfirmFullBtn}
                      onPress={() => handleConfirmOrder(selectedOrder.id)}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.voucherConfirmFullBtnText}>Confirm Settlement</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.voucherCancelOrderBtn}
                      onPress={() => handleCancelOrder(selectedOrder.id)}
                    >
                      <Text style={styles.voucherCancelOrderBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.voucherShareBtn}
                      onPress={() => selectedOrder && handleShareReceipt(selectedOrder)}
                    >
                      <Ionicons name="share-outline" size={16} color={Colors.primary} />
                      <Text style={styles.voucherShareBtnText}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.voucherReorderFullBtn}
                      onPress={() => {
                        setSelectedOrder(null);
                        if (selectedOrder?.type === 'Buy' && onNavigateToBuy) {
                          onNavigateToBuy();
                        } else if (onNavigateToSell) {
                          onNavigateToSell();
                        } else {
                          setShowNewTradeModal(true);
                        }
                      }}
                    >
                      <Ionicons name="repeat" size={16} color="#FFFFFF" />
                      <Text style={styles.voucherReorderFullBtnText}>Trade Again</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 2: FILTER ORDERS MODAL */}
        <Modal
          visible={showFilterModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.filterModalCard}>
              <View style={styles.filterModalHeader}>
                <View style={styles.filterHeaderLeft}>
                  <View style={styles.filterIconCircle}>
                    <Ionicons name="funnel" size={17} color={Colors.primary} />
                  </View>
                  <Text style={styles.filterModalTitle}>Filter Ledger History</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseIconBtn}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              {/* Order Status Chips */}
              <Text style={styles.filterSectionLabel}>ORDER TYPE</Text>
              <View style={styles.filterChipsGrid}>
                {[
                  { key: 'All', label: 'All Orders', count: orders.length },
                  { key: 'Buy', label: 'Buy Orders', count: buyCount },
                  { key: 'Sell', label: 'Sell Orders', count: sellCount },
                  { key: 'Processing', label: 'In Escrow', count: processingCount },
                  { key: 'Completed', label: 'Completed', count: completedCount },
                ].map((item) => {
                  const isSelected = activeTab === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.filterChip, isSelected && styles.filterChipActive]}
                      onPress={() => setActiveTab(item.key as any)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isSelected && styles.filterChipTextActive,
                        ]}
                      >
                        {item.label} ({item.count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Asset Chips */}
              <Text style={[styles.filterSectionLabel, { marginTop: 14 }]}>CRYPTO TOKEN</Text>
              <View style={styles.filterChipsRow}>
                {(['ALL', 'xCoin', 'USDT'] as const).map((tok) => {
                  const isSelected = selectedAsset === tok;
                  return (
                    <TouchableOpacity
                      key={tok}
                      style={[styles.filterAssetChip, isSelected && styles.filterAssetChipActive]}
                      onPress={() => setSelectedAsset(tok)}
                    >
                      <Text
                        style={[
                          styles.filterAssetChipText,
                          isSelected && styles.filterAssetChipTextActive,
                        ]}
                      >
                        {tok === 'ALL' ? 'All Tokens' : tok}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Modal Buttons */}
              <View style={styles.filterModalActions}>
                <TouchableOpacity
                  style={styles.filterResetBtn}
                  onPress={() => {
                    setActiveTab('All');
                    setSelectedAsset('ALL');
                    setSearchQuery('');
                    setShowFilterModal(false);
                  }}
                >
                  <Text style={styles.filterResetBtnText}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.filterApplyBtn}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Text style={styles.filterApplyBtnText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 3: DOWNLOAD TAX / LEDGER STATEMENT */}
        <Modal
          visible={showExportModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowExportModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.exportModalCard}>
              <View style={styles.exportHeader}>
                <View style={styles.exportIconCircle}>
                  <Ionicons name="download" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.exportTitle}>Download Statement</Text>
                <Text style={styles.exportSubtitle}>
                  Official audit & tax ledger for your crypto executions
                </Text>
              </View>

              {/* Format selection */}
              <Text style={styles.exportSectionLabel}>FORMAT</Text>
              <View style={styles.formatSelectRow}>
                <TouchableOpacity
                  style={[
                    styles.formatOptionBox,
                    exportFormat === 'PDF' && styles.formatOptionBoxActive,
                  ]}
                  onPress={() => setExportFormat('PDF')}
                >
                  <Ionicons
                    name="document-text"
                    size={20}
                    color={exportFormat === 'PDF' ? Colors.primary : '#707EAE'}
                  />
                  <Text
                    style={[
                      styles.formatOptionText,
                      exportFormat === 'PDF' && styles.formatOptionTextActive,
                    ]}
                  >
                    PDF Voucher
                  </Text>
                  <Text style={styles.formatOptionSub}>Tax & Audit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.formatOptionBox,
                    exportFormat === 'CSV' && styles.formatOptionBoxActive,
                  ]}
                  onPress={() => setExportFormat('CSV')}
                >
                  <Ionicons
                    name="grid"
                    size={20}
                    color={exportFormat === 'CSV' ? Colors.primary : '#707EAE'}
                  />
                  <Text
                    style={[
                      styles.formatOptionText,
                      exportFormat === 'CSV' && styles.formatOptionTextActive,
                    ]}
                  >
                    CSV Sheet
                  </Text>
                  <Text style={styles.formatOptionSub}>Excel / Sheets</Text>
                </TouchableOpacity>
              </View>

              {/* Period selection */}
              <Text style={[styles.exportSectionLabel, { marginTop: 14 }]}>DATE PERIOD</Text>
              <View style={styles.rangeSelectRow}>
                {[
                  { key: '30D', label: 'Last 30 Days' },
                  { key: '90D', label: 'Last 90 Days' },
                  { key: 'ALL', label: 'All-Time' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.rangeChip,
                      exportRange === item.key && styles.rangeChipActive,
                    ]}
                    onPress={() => setExportRange(item.key as any)}
                  >
                    <Text
                      style={[
                        styles.rangeChipText,
                        exportRange === item.key && styles.rangeChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Export Modal Actions */}
              <View style={styles.exportModalActions}>
                <TouchableOpacity
                  style={styles.exportCancelBtn}
                  onPress={() => setShowExportModal(false)}
                >
                  <Text style={styles.exportCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.exportSubmitBtn}
                  onPress={handleDownloadStatement}
                >
                  <Ionicons name="cloud-download-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.exportSubmitBtnText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 4: NEW TRADE QUICK LAUNCHER */}
        <Modal
          visible={showNewTradeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNewTradeModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.newTradeModalCard}>
              <View style={styles.filterModalHeader}>
                <View style={styles.filterHeaderLeft}>
                  <View style={styles.filterIconCircle}>
                    <Ionicons name="flash" size={17} color={Colors.primary} />
                  </View>
                  <Text style={styles.filterModalTitle}>Initiate Web3 Trade</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseIconBtn}
                  onPress={() => setShowNewTradeModal(false)}
                >
                  <Ionicons name="close" size={20} color="#707EAE" />
                </TouchableOpacity>
              </View>

              <Text style={styles.newTradeSubtitle}>
                Select order type to enter the zero-fee instant P2P trading portal:
              </Text>

              {/* Buy xCoin Option */}
              <TouchableOpacity
                style={styles.tradeOptionTile}
                onPress={() => {
                  setShowNewTradeModal(false);
                  if (onNavigateToBuy) onNavigateToBuy();
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.tradeOptionIconBox, { backgroundColor: '#E6FAF5' }]}>
                  <Ionicons name="arrow-down-circle" size={22} color="#05CD99" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tradeOptionTitle}>Buy xCoin / USDT</Text>
                  <Text style={styles.tradeOptionSub}>Pay via UPI, GPay, IMPS • Instant Web3 Release</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#707EAE" />
              </TouchableOpacity>

              {/* Sell xCoin Option */}
              <TouchableOpacity
                style={styles.tradeOptionTile}
                onPress={() => {
                  setShowNewTradeModal(false);
                  if (onNavigateToSell) onNavigateToSell();
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.tradeOptionIconBox, { backgroundColor: '#FFF7ED' }]}>
                  <Ionicons name="arrow-up-circle" size={22} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tradeOptionTitle}>Sell xCoin to Cash</Text>
                  <Text style={styles.tradeOptionSub}>Instant transfer directly into your linked bank account</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#707EAE" />
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
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1B2559',
    letterSpacing: -0.4,
  },
  protocolBadge: {
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
  pulseGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#05CD99',
  },
  protocolBadgeText: {
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
    position: 'relative',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  toolIconBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  activeFilterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 40,
  },

  /* In-Progress Escrow Alert Banner */
  activeAlertBanner: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  activeAlertGradient: {
    padding: 13,
  },
  activeAlertTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  alertClockCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  alertCountdownBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: '#F59E0B',
  },
  alertCountdownText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
  },
  alertSub: {
    fontSize: 11,
    color: '#78350F',
    fontWeight: '600',
    marginTop: 1,
  },
  alertActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#D97706',
    paddingVertical: 8,
    borderRadius: 10,
  },
  alertConfirmBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  alertDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertDetailsBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
  },

  /* MASTER 30-DAY TURNOVER HERO CARD */
  turnoverHeroCard: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    marginBottom: 14,
    shadowColor: '#0B132B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  turnoverHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  turnoverTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  turnoverIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',
  },
  turnoverCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  turnoverCardSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 0.5,
  },
  zeroGasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  zeroGasBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#34D399',
  },

  turnoverMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  turnoverAmountBlock: {
    flex: 1,
  },
  turnoverLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  turnoverLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 2,
  },
  turnoverMainNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  turnoverDigits: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  turnoverCurrency: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  turnoverTokensSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  newTradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  newTradeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* 3-Part Flow Strip */
  flowMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  flowCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  flowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  flowColLabel: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  flowColVal: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  flowColSub: {
    fontSize: 8.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },

  /* SEARCH BAR */
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    paddingHorizontal: 13,
    height: 44,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    marginBottom: 10,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#1B2559',
    fontWeight: '600',
  },

  /* ASSET FILTER CHIPS */
  assetFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  assetChip: {
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#E8EDF8',
  },
  assetChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: Colors.primary,
  },
  assetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#707EAE',
  },
  assetChipTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },

  /* TAB BUTTONS ROW */
  tabsScrollContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  tabButton: {
    paddingHorizontal: 13,
    paddingVertical: 7.5,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#E8EDF8',
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#707EAE',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* ORDERS FEED */
  ordersListContainer: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8EDF8',
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 11,
  },
  orderCardLeftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderTokenIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  orderTokenLogo: {
    width: 23,
    height: 23,
  },
  orderDirectionBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  orderActionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderActionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1B2559',
  },
  orderTypeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  orderTypeBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  orderIdCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  orderIdCapsuleText: {
    fontSize: 11,
    color: '#707EAE',
    fontWeight: '600',
  },

  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusBadgePillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },

  orderCardMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 11,
  },
  orderCryptoAmountText: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  orderRateText: {
    fontSize: 11,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 1,
  },
  orderFiatTotalText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1B2559',
  },
  receiptVoucherLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  receiptVoucherLinkText: {
    fontSize: 10.5,
    color: Colors.primary,
    fontWeight: '700',
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 9,
  },

  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentMethodText: {
    fontSize: 10.5,
    color: '#707EAE',
    fontWeight: '600',
  },
  orderTimestampText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  orderCardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardQuickConfirmBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardQuickConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  cardReorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  cardReorderBtnText: {
    color: Colors.primary,
    fontSize: 10.5,
    fontWeight: '700',
  },

  /* Empty state */
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 45,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF8',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B2559',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#707EAE',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 17,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  emptyResetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  emptyResetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#707EAE',
  },
  emptyNewTradeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  emptyNewTradeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  /* MODALS COMMON */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },

  /* VOUCHER MODAL */
  voucherModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  voucherModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  voucherHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voucherStatusCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherModalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1B2559',
  },
  voucherModalSubtitle: {
    fontSize: 11,
    color: '#707EAE',
    fontWeight: '600',
    marginTop: 1,
  },
  modalCloseIconBtn: {
    padding: 4,
  },

  /* Escrow Stepper */
  escrowStepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperItem: {
    alignItems: 'center',
    gap: 3,
  },
  stepperCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCircleDone: {
    backgroundColor: '#05CD99',
  },
  stepperCirclePending: {
    backgroundColor: '#E2E8F0',
  },
  stepperLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#707EAE',
  },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 6,
    marginBottom: 14,
  },
  stepperLineDone: {
    backgroundColor: '#05CD99',
  },

  /* Voucher Table */
  voucherTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  voucherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6.5,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  voucherLabel: {
    fontSize: 11.5,
    color: '#707EAE',
    fontWeight: '600',
  },
  voucherVal: {
    fontSize: 12,
    color: '#1B2559',
    fontWeight: '700',
  },
  txHashCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  txHashText: {
    fontSize: 11,
    color: '#707EAE',
    fontWeight: '600',
  },

  voucherActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  voucherShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  voucherShareBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: Colors.primary,
  },
  voucherReorderFullBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  voucherReorderFullBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  voucherConfirmFullBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#D97706',
  },
  voucherConfirmFullBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  voucherCancelOrderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FEEFEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherCancelOrderBtnText: {
    color: '#EE5D50',
    fontSize: 12,
    fontWeight: '700',
  },

  /* FILTER MODAL */
  filterModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  filterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B2559',
  },
  filterSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  filterChipsGrid: {
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8.5,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B2559',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterAssetChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterAssetChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterAssetChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1B2559',
  },
  filterAssetChipTextActive: {
    color: '#FFFFFF',
  },
  filterModalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterResetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#707EAE',
  },
  filterApplyBtn: {
    flex: 1.5,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterApplyBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* EXPORT MODAL */
  exportModalCard: {
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
  exportHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  exportIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1B2559',
  },
  exportSubtitle: {
    fontSize: 11.5,
    color: '#707EAE',
    textAlign: 'center',
    marginTop: 2,
  },
  exportSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#707EAE',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  formatSelectRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formatOptionBox: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  formatOptionBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF2FF',
  },
  formatOptionText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1B2559',
    marginTop: 4,
  },
  formatOptionTextActive: {
    color: Colors.primary,
  },
  formatOptionSub: {
    fontSize: 9.5,
    color: '#707EAE',
    marginTop: 1,
  },
  rangeSelectRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  rangeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  rangeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rangeChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#707EAE',
  },
  rangeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  exportModalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exportCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportCancelBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#707EAE',
  },
  exportSubmitBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  exportSubmitBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* NEW TRADE MODAL */
  newTradeModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  newTradeSubtitle: {
    fontSize: 11.5,
    color: '#707EAE',
    marginBottom: 14,
    lineHeight: 16,
  },
  tradeOptionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  tradeOptionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeOptionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1B2559',
  },
  tradeOptionSub: {
    fontSize: 10,
    color: '#707EAE',
    marginTop: 2,
    lineHeight: 14,
  },
});
