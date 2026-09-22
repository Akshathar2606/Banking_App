import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { getAccounts, Account } from '../services/accountService';
import { getBills, payBill, Bill, BillStatus } from '../services/billService';
import { Colors } from '../constants/Colors';

// ── Display helpers ────────────────────────────────────────────────────────────

const BILL_ICONS: Record<string, string> = {
  electricity: '⚡',
  water:       '💧',
  internet:    '🌐',
  mobile:      '📱',
  other:       '🧾',
};

const STATUS_CONFIG: Record<BillStatus, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Pending',  color: Colors.warning,  bg: Colors.warning  + '18' },
  overdue:  { label: 'Overdue',  color: Colors.error,    bg: Colors.error    + '18' },
  paid:     { label: 'Paid',     color: Colors.success,  bg: Colors.success  + '18' },
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const isPayable = (status: BillStatus) => status === 'pending' || status === 'overdue';

// ── Component ──────────────────────────────────────────────────────────────────

export default function BillsScreen() {
  const { token } = useAuth();
  const router    = useRouter();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [bills, setBills]             = useState<Bill[]>([]);
  const [accounts, setAccounts]       = useState<Account[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // ── Payment state ────────────────────────────────────────────────────────────
  const [confirmBillId, setConfirmBillId] = useState<string | null>(null);
  const [payingBillId, setPayingBillId]   = useState<string | null>(null);
  const [payError, setPayError]           = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Load bills and accounts ───────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [billData, accountData] = await Promise.all([
        getBills(token),
        getAccounts(token),
      ]);
      setBills(billData);
      setAccounts(accountData.filter(a => a.status === 'active'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  // Use the first active account as the payment account
  const paymentAccount = accounts[0] ?? null;

  // ── Pay handler ───────────────────────────────────────────────────────────────
  const handlePayPress = (bill: Bill) => {
    setPayError(null);
    setSuccessMessage(null);

    if (!paymentAccount) {
      setPayError('No active account found to make a payment.');
      return;
    }
    if (paymentAccount.balance < bill.amount) {
      setPayError(
        `Insufficient balance. Required: ${bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} — Available: ${paymentAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ${paymentAccount.currency}`
      );
      return;
    }

    if (Platform.OS !== 'web') {
      // Native: use Alert for confirmation
      Alert.alert(
        'Confirm Payment',
        `Pay ${paymentAccount.currency} ${bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to ${bill.billerName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Pay Now', style: 'default', onPress: () => executePay(bill) },
        ]
      );
    } else {
      // Web: show inline confirmation card
      setConfirmBillId(bill._id);
    }
  };

  const executePay = async (bill: Bill) => {
    if (!token || !paymentAccount) return;
    setConfirmBillId(null);
    setPayingBillId(bill._id);
    setPayError(null);
    setSuccessMessage(null);

    try {
      const result = await payBill(token, bill._id, paymentAccount._id);
      setSuccessMessage(
        `${bill.billerName} bill paid successfully! Reference: ${result.transaction.reference}`
      );
      // Refresh the list so the paid bill reflects its new status
      await loadData();
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment failed.');
    } finally {
      setPayingBillId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Bills</Text>
        <TouchableOpacity onPress={loadData} activeOpacity={0.7} style={styles.refreshButton}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment account info */}
        {paymentAccount && (
          <View style={styles.accountBadge}>
            <Text style={styles.accountBadgeText}>
              💳  Paying from: {paymentAccount.accountNumber}
              {'  •  '}
              {paymentAccount.currency} {paymentAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        )}

        {/* Success banner */}
        {successMessage && (
          <View style={styles.successBanner}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* Error banner */}
        {(error || payError) && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error ?? payError}</Text>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.centerText}>Loading bills…</Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && !error && bills.length === 0 && (
          <View style={styles.centerBox}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyTitle}>No bills found</Text>
            <Text style={styles.emptySubtext}>
              Bills added to your account will appear here.
            </Text>
          </View>
        )}

        {/* Bills list */}
        {!loading && bills.map((bill) => {
          const statusCfg  = STATUS_CONFIG[bill.status];
          const icon       = BILL_ICONS[bill.billType] ?? '🧾';
          const isPaying   = payingBillId === bill._id;
          const isConfirming = confirmBillId === bill._id;

          return (
            <View key={bill._id} style={styles.billCard}>
              {/* Bill header row */}
              <View style={styles.billHeader}>
                <View style={styles.billIconWrap}>
                  <Text style={styles.billIcon}>{icon}</Text>
                </View>
                <View style={styles.billInfo}>
                  <Text style={styles.billerName}>{bill.billerName}</Text>
                  <Text style={styles.billMeta}>
                    {bill.billType.charAt(0).toUpperCase() + bill.billType.slice(1)}
                    {' · '}#{bill.consumerNumber}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                  <Text style={[styles.statusText, { color: statusCfg.color }]}>
                    {statusCfg.label}
                  </Text>
                </View>
              </View>

              {/* Amount and due date */}
              <View style={styles.billDetails}>
                <View>
                  <Text style={styles.detailLabel}>Amount due</Text>
                  <Text style={styles.detailAmount}>
                    ₹{bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.detailRight}>
                  <Text style={styles.detailLabel}>
                    {bill.status === 'paid' ? 'Paid on' : 'Due by'}
                  </Text>
                  <Text style={[
                    styles.detailDate,
                    bill.status === 'overdue' && styles.detailDateOverdue,
                  ]}>
                    {bill.status === 'paid' && bill.paidAt
                      ? formatDate(bill.paidAt)
                      : formatDate(bill.dueDate)}
                  </Text>
                </View>
              </View>

              {/* Web inline confirmation */}
              {isConfirming && (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmText}>
                    Pay ₹{bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to {bill.billerName}?
                  </Text>
                  <View style={styles.confirmButtons}>
                    <TouchableOpacity
                      style={styles.confirmCancel}
                      onPress={() => setConfirmBillId(null)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.confirmCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmPay}
                      onPress={() => executePay(bill)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.confirmPayText}>Pay Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Pay button — only for pending/overdue and not currently paying */}
              {isPayable(bill.status) && !isConfirming && (
                <TouchableOpacity
                  style={[styles.payButton, isPaying && styles.payButtonDisabled]}
                  onPress={() => handlePayPress(bill)}
                  disabled={isPaying}
                  activeOpacity={0.8}
                >
                  {isPaying ? (
                    <ActivityIndicator color={Colors.backgroundLight} size="small" />
                  ) : (
                    <Text style={styles.payButtonText}>Pay Now</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: Colors.text,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '700',
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  // Account badge
  accountBadge: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  accountBadgeText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Banners
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.success + '18',
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  successIcon: {
    fontSize: 16,
    color: Colors.success,
    fontWeight: '700',
    marginTop: 1,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500',
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: Colors.error + '18',
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '500',
  },

  // Loading / empty
  centerBox: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  centerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },

  // Bill card
  billCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  billIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  billIcon: {
    fontSize: 22,
  },
  billInfo: {
    flex: 1,
  },
  billerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  billMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Amount / date row
  billDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  detailRight: {
    alignItems: 'flex-end',
  },
  detailDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  detailDateOverdue: {
    color: Colors.error,
  },

  // Inline confirmation (web)
  confirmBox: {
    backgroundColor: Colors.warning + '12',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  confirmText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmCancel: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmPay: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmPayText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.backgroundLight,
  },

  // Pay button
  payButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.backgroundLight,
    letterSpacing: 0.3,
  },
});
