import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import {
  getTransactions,
  Transaction,
  TransactionType,
} from '../services/transactionService';
import { Colors } from '../constants/Colors';

// ── Display helpers ────────────────────────────────────────────────────────────

/** Deposit is the only type that credits the user's account */
const isIncoming = (type: TransactionType): boolean => type === 'deposit';

const TX_META: Record<TransactionType, { icon: string; label: string }> = {
  transfer:    { icon: '↗', label: 'Transfer' },
  deposit:     { icon: '↙', label: 'Deposit' },
  withdrawal:  { icon: '↑', label: 'Withdrawal' },
  bill_payment: { icon: '📄', label: 'Bill Payment' },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  completed:  { color: Colors.success,      bg: Colors.success  + '18' },
  pending:    { color: Colors.warning,      bg: Colors.warning  + '18' },
  failed:     { color: Colors.error,        bg: Colors.error    + '18' },
  cancelled:  { color: Colors.textSecondary, bg: Colors.divider },
};

const formatDate = (iso: string): string => {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return `Today, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  if (diff === 1) return `Yesterday, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  if (diff < 7)  return `${diff} days ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ── Filter definition ─────────────────────────────────────────────────────────

type FilterKey = 'all' | 'transfer' | 'bill_payment';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',          label: 'All' },
  { key: 'transfer',     label: 'Transfers' },
  { key: 'bill_payment', label: 'Bill Payments' },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const { token } = useAuth();
  const router    = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  // ── Fetch on mount ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getTransactions(token);
        setTransactions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  // ── Filter ────────────────────────────────────────────────────────────────────
  const filtered: Transaction[] =
    activeFilter === 'all'
      ? transactions
      : transactions.filter(t => t.type === activeFilter);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Loading */}
        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.centerText}>Loading transactions…</Text>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <View style={styles.centerBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>
              {activeFilter === 'all' ? 'No transactions yet' : `No ${FILTERS.find(f => f.key === activeFilter)?.label.toLowerCase()} yet`}
            </Text>
            <Text style={styles.emptySubtext}>
              Transactions will appear here once you start using your account.
            </Text>
          </View>
        )}

        {/* Transaction list */}
        {!loading && filtered.map((tx, index) => {
          const meta       = TX_META[tx.type] ?? { icon: '↔', label: tx.type };
          const incoming   = isIncoming(tx.type);
          const statusCfg  = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;
          const amountStr  = incoming
            ? `+${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            : `-${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
          const amountColor = incoming ? Colors.income : Colors.text;
          const iconBg      = incoming ? Colors.income + '15' : Colors.expense + '15';

          // Best available title for the row
          const title = tx.description ?? tx.recipientName ?? meta.label;

          return (
            <View
              key={tx._id}
              style={[
                styles.txCard,
                index === filtered.length - 1 && styles.txCardLast,
              ]}
            >
              {/* Left: icon + info */}
              <View style={[styles.txIcon, { backgroundColor: iconBg }]}>
                <Text style={styles.txIconText}>{meta.icon}</Text>
              </View>

              <View style={styles.txInfo}>
                {/* Row 1: title + amount */}
                <View style={styles.txRow}>
                  <Text style={styles.txTitle} numberOfLines={1}>{title}</Text>
                  <Text style={[styles.txAmount, { color: amountColor }]}>
                    {amountStr}
                  </Text>
                </View>

                {/* Row 2: type label + status chip */}
                <View style={styles.txRow}>
                  <Text style={styles.txMeta}>{meta.label}</Text>
                  <View style={[styles.statusChip, { backgroundColor: statusCfg.bg }]}>
                    <Text style={[styles.statusText, { color: statusCfg.color }]}>
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Row 3: date */}
                <Text style={styles.txDate}>{formatDate(tx.date)}</Text>

                {/* Reference */}
                <Text style={styles.txRef} numberOfLines={1}>Ref: {tx.reference}</Text>
              </View>
            </View>
          );
        })}

        {/* Count footer */}
        {!loading && filtered.length > 0 && (
          <Text style={styles.countFooter}>
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
            {activeFilter !== 'all' ? ` · ${FILTERS.find(f => f.key === activeFilter)?.label}` : ''}
          </Text>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.backgroundLight,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 20, color: Colors.text, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  headerSpacer: { width: 36 },

  // Filter bar
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: Colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.primary,
  },

  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },

  // Error
  errorBanner: {
    backgroundColor: Colors.error + '18',
    borderLeftWidth: 3, borderLeftColor: Colors.error,
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14,
  },
  errorText: { fontSize: 13, color: Colors.error, fontWeight: '500' },

  // Loading / empty
  centerBox: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  centerText: { fontSize: 14, color: Colors.textSecondary, marginTop: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  emptySubtext: {
    fontSize: 13, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20, paddingHorizontal: 24,
  },

  // Transaction card
  txCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  txCardLast: {
    marginBottom: 0,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  txIconText: { fontSize: 20 },

  txInfo: { flex: 1 },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 0,
  },
  txMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusChip: {
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  txDate: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    marginBottom: 2,
  },
  txRef: {
    fontSize: 10,
    color: Colors.textLight,
    fontFamily: 'monospace',
  },

  // Footer
  countFooter: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 16,
  },
});
