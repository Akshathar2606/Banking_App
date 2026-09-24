import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Colors';
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { getAccounts, Account } from '../services/accountService';
import { getTransactions, Transaction } from '../services/transactionService';

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: '1', icon: '↗', label: 'Send Money', color: Colors.primary },
  { id: '2', icon: '↙', label: 'Add Money', color: Colors.accent },
  { id: '3', icon: '📄', label: 'Pay Bills', color: Colors.warning },
  { id: '4', icon: '📊', label: 'Transactions', color: Colors.secondary },
];

// ── Transaction display helpers ───────────────────────────────────────────────

/** Icon and human-readable label for each transaction type */
const TX_META: Record<string, { icon: string; label: string }> = {
  transfer:    { icon: '↗', label: 'Transfer' },
  deposit:     { icon: '↙', label: 'Deposit' },
  withdrawal:  { icon: '↑', label: 'Withdrawal' },
  bill_payment: { icon: '📄', label: 'Bill Payment' },
};

/** Format an ISO date string to a short, readable label */
const formatTxDate = (isoString: string): string => {
  const date  = new Date(isoString);
  const now   = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return `${diffDays} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function Index() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab]               = useState('Home');
  const [balanceVisible, setBalanceVisible]     = useState(true);
  const [accounts, setAccounts]                 = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading]   = useState(false);
  const [accountsError, setAccountsError]       = useState<string | null>(null);
  const [transactions, setTransactions]         = useState<Transaction[]>([]);
  const [txLoading, setTxLoading]               = useState(false);
  const [txError, setTxError]                   = useState<string | null>(null);

  // Fetch accounts and transactions whenever the dashboard gains focus.
  // This keeps data fresh after returning from /transfer or /bills.
  useFocusEffect(
    useCallback(() => {
      if (!token) return;

      let cancelled = false;

      const loadDashboardData = async () => {
        // Accounts
        setAccountsLoading(true);
        setAccountsError(null);
        // Transactions
        setTxLoading(true);
        setTxError(null);

        try {
          const [accountData, txData] = await Promise.all([
            getAccounts(token),
            getTransactions(token),
          ]);
          if (!cancelled) {
            setAccounts(accountData);
            setTransactions(txData);
          }
        } catch (err) {
          if (!cancelled) {
            const msg = err instanceof Error ? err.message : 'Failed to load data.';
            setAccountsError(msg);
            setTxError(msg);
          }
        } finally {
          if (!cancelled) {
            setAccountsLoading(false);
            setTxLoading(false);
          }
        }
      };

      loadDashboardData();

      // Cleanup: ignore stale responses if the effect re-runs before completion
      return () => { cancelled = true; };
    }, [token])
  );

  // Sum balances across all accounts; fall back to 0 when still loading
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  // Use the currency from the first account, or INR as the default
  const currency = accounts[0]?.currency ?? 'INR';

  // Show only the 5 most recent transactions on the dashboard
  const recentTransactions = transactions.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.userName}>{user?.name ?? 'Guest'}</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={logout} activeOpacity={0.8}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <TouchableOpacity 
                onPress={() => setBalanceVisible(!balanceVisible)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.eyeIcon}>{balanceVisible ? '👁' : '👁‍🗨'}</Text>
              </TouchableOpacity>
            </View>

            {accountsLoading ? (
              <ActivityIndicator
                color={Colors.backgroundLight}
                size="large"
                style={{ marginVertical: 8 }}
              />
            ) : accountsError ? (
              <Text style={styles.balanceError}>{accountsError}</Text>
            ) : (
              <Text style={styles.balanceAmount}>
                {balanceVisible
                  ? `${currency} ${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '****'}
              </Text>
            )}

            <Text style={styles.balanceSubtext}>
              {accounts.length > 0
                ? `${accounts.length} account${accounts.length > 1 ? 's' : ''} • ${currency}`
                : 'Demo Account • Academic Project'}
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionButton}
                activeOpacity={0.7}
                onPress={
                  action.id === '1' ? () => router.push('/transfer') :
                  action.id === '2' ? () => router.push('/add-money') :
                  action.id === '3' ? () => router.push('/bills') :
                  action.id === '4' ? () => router.push('/transactions') :
                  undefined
                }
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                  <Text style={styles.actionIconText}>{action.icon}</Text>
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {txLoading ? (
              <View style={styles.txCenterBox}>
                <ActivityIndicator color={Colors.primary} size="small" />
              </View>
            ) : txError ? (
              <View style={styles.txCenterBox}>
                <Text style={styles.txErrorText}>{txError}</Text>
              </View>
            ) : recentTransactions.length === 0 ? (
              <View style={styles.txCenterBox}>
                <Text style={styles.txEmptyIcon}>💳</Text>
                <Text style={styles.txEmptyText}>No transactions yet</Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {recentTransactions.map((tx, index) => {
                  const isIncoming = tx.type === 'deposit';
                  const icon       = TX_META[tx.type]?.icon   ?? '↔';
                  const label      = TX_META[tx.type]?.label  ?? tx.type;
                  const bgColor    = isIncoming
                    ? Colors.income + '15'
                    : Colors.expense + '15';
                  const amountColor = isIncoming ? Colors.income : Colors.text;
                  const amountStr   = isIncoming
                    ? `+${tx.amount.toFixed(2)}`
                    : `-${tx.amount.toFixed(2)}`;
                  const dateStr = formatTxDate(tx.date);
                  const title   = tx.description ?? tx.recipientName ?? label;

                  return (
                    <TouchableOpacity
                      key={tx._id}
                      style={[
                        styles.transactionItem,
                        index === recentTransactions.length - 1 && styles.transactionItemLast,
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.transactionLeft}>
                        <View style={[styles.transactionIcon, { backgroundColor: bgColor }]}>
                          <Text style={styles.transactionIconText}>{icon}</Text>
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionTitle} numberOfLines={1}>
                            {title}
                          </Text>
                          <Text style={styles.transactionCategory}>
                            {label} • {dateStr}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.transactionAmount, { color: amountColor }]}>
                        {amountStr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Bottom padding for navigation */}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          {['Home', 'Cards', 'History', 'Profile'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.navItem}
              onPress={() => {
                if (tab === 'Cards')   { router.push('/cards');         return; }
                if (tab === 'History') { router.push('/transactions');  return; }
                if (tab === 'Profile') { router.push('/beneficiaries'); return; }
                setActiveTab(tab);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.navIcon,
                activeTab === tab && styles.navIconActive
              ]}>
                {tab === 'Home' ? '🏠' : tab === 'Cards' ? '💳' : tab === 'History' ? '📋' : '👤'}
              </Text>
              <Text style={[
                styles.navLabel,
                activeTab === tab && styles.navLabelActive
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.navItem}
            onPress={logout}
            activeOpacity={0.7}
          >
            <Text style={styles.navIcon}>🚪</Text>
            <Text style={[styles.navLabel, styles.navLabelLogout]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.backgroundLight,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  balanceCard: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.backgroundLight,
    opacity: 0.9,
    fontWeight: '500',
  },
  eyeIcon: {
    fontSize: 18,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.backgroundLight,
    marginBottom: 8,
  },
  balanceSubtext: {
    fontSize: 12,
    color: Colors.backgroundLight,
    opacity: 0.8,
  },
  balanceError: {
    fontSize: 14,
    color: Colors.backgroundLight,
    opacity: 0.9,
    marginVertical: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIconText: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  transactionsSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  transactionsList: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 4,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  transactionItemLast: {
    borderBottomWidth: 0,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 18,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  // Transaction loading / empty / error states
  txCenterBox: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  txEmptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  txEmptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  txErrorText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundLight,
    paddingVertical: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  navIcon: {
    fontSize: 22,
    marginBottom: 4,
    opacity: 0.5,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 11,
    color: Colors.navInactive,
    fontWeight: '500',
  },
  navLabelActive: {
    color: Colors.navActive,
    fontWeight: '600',
  },
  navLabelLogout: {
    color: Colors.error,
    fontWeight: '600',
  },
});
