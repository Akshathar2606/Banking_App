import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Colors';
import { useState } from 'react';

// Type definitions
interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
}

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  color: string;
}

// Demo data
const DEMO_TRANSACTIONS: Transaction[] = [
  { id: '1', title: 'Salary Deposit', category: 'Income', amount: 3500.00, date: 'Today', type: 'income' },
  { id: '2', title: 'Grocery Store', category: 'Shopping', amount: -87.50, date: 'Today', type: 'expense' },
  { id: '3', title: 'Electric Bill', category: 'Utilities', amount: -125.00, date: 'Yesterday', type: 'expense' },
  { id: '4', title: 'Online Transfer', category: 'Transfer', amount: -200.00, date: 'Yesterday', type: 'expense' },
  { id: '5', title: 'Freelance Payment', category: 'Income', amount: 450.00, date: '2 days ago', type: 'income' },
];

const QUICK_ACTIONS: QuickAction[] = [
  { id: '1', icon: '↗', label: 'Send Money', color: Colors.primary },
  { id: '2', icon: '↙', label: 'Add Money', color: Colors.accent },
  { id: '3', icon: '📄', label: 'Pay Bills', color: Colors.warning },
  { id: '4', icon: '📊', label: 'Transactions', color: Colors.secondary },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState('Home');
  const [balanceVisible, setBalanceVisible] = useState(true);

  const demoBalance = 5247.83;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.userName}>Sarah Johnson</Text>
          </View>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>SJ</Text>
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
            <Text style={styles.balanceAmount}>
              {balanceVisible ? `$${demoBalance.toFixed(2)}` : '****'}
            </Text>
            <Text style={styles.balanceSubtext}>
              Demo Account • Academic Project
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity 
                key={action.id} 
                style={styles.actionButton}
                activeOpacity={0.7}
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

            <View style={styles.transactionsList}>
              {DEMO_TRANSACTIONS.map((transaction, index) => (
                <TouchableOpacity 
                  key={transaction.id} 
                  style={[
                    styles.transactionItem,
                    index === DEMO_TRANSACTIONS.length - 1 && styles.transactionItemLast
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.transactionIcon,
                      { backgroundColor: transaction.type === 'income' ? Colors.income + '15' : Colors.expense + '15' }
                    ]}>
                      <Text style={styles.transactionIconText}>
                        {transaction.type === 'income' ? '↓' : '↑'}
                      </Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>{transaction.title}</Text>
                      <Text style={styles.transactionCategory}>{transaction.category} • {transaction.date}</Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'income' ? Colors.income : Colors.text }
                  ]}>
                    {transaction.type === 'income' ? '+' : ''}{transaction.amount < 0 ? transaction.amount : `+${transaction.amount.toFixed(2)}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
              onPress={() => setActiveTab(tab)}
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
});
