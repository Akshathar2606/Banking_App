import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Colors';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';

// Type definitions
interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  fullDate: string;
  type: 'income' | 'expense';
  description: string;
}

type FilterType = 'all' | 'income' | 'expense';

// Extended demo transaction data
const DEMO_TRANSACTIONS: Transaction[] = [
  { 
    id: '1', 
    title: 'Salary Deposit', 
    category: 'Income', 
    amount: 3500.00, 
    date: 'Today', 
    fullDate: 'Sep 21, 2026',
    type: 'income',
    description: 'Monthly salary from employer'
  },
  { 
    id: '2', 
    title: 'Grocery Store', 
    category: 'Shopping', 
    amount: -87.50, 
    date: 'Today', 
    fullDate: 'Sep 21, 2026',
    type: 'expense',
    description: 'Weekly groceries at Whole Foods'
  },
  { 
    id: '3', 
    title: 'Electric Bill', 
    category: 'Utilities', 
    amount: -125.00, 
    date: 'Yesterday', 
    fullDate: 'Sep 20, 2026',
    type: 'expense',
    description: 'Monthly electricity payment'
  },
  { 
    id: '4', 
    title: 'Online Transfer', 
    category: 'Transfer', 
    amount: -200.00, 
    date: 'Yesterday', 
    fullDate: 'Sep 20, 2026',
    type: 'expense',
    description: 'Transfer to savings account'
  },
  { 
    id: '5', 
    title: 'Freelance Payment', 
    category: 'Income', 
    amount: 450.00, 
    date: 'Sep 19', 
    fullDate: 'Sep 19, 2026',
    type: 'income',
    description: 'Web design project payment'
  },
  { 
    id: '6', 
    title: 'Restaurant', 
    category: 'Food & Dining', 
    amount: -65.00, 
    date: 'Sep 19', 
    fullDate: 'Sep 19, 2026',
    type: 'expense',
    description: 'Dinner at Italian restaurant'
  },
  { 
    id: '7', 
    title: 'Gas Station', 
    category: 'Transportation', 
    amount: -45.00, 
    date: 'Sep 18', 
    fullDate: 'Sep 18, 2026',
    type: 'expense',
    description: 'Fuel refill'
  },
  { 
    id: '8', 
    title: 'Investment Return', 
    category: 'Income', 
    amount: 125.75, 
    date: 'Sep 18', 
    fullDate: 'Sep 18, 2026',
    type: 'income',
    description: 'Quarterly dividend payment'
  },
  { 
    id: '9', 
    title: 'Coffee Shop', 
    category: 'Food & Dining', 
    amount: -12.50, 
    date: 'Sep 17', 
    fullDate: 'Sep 17, 2026',
    type: 'expense',
    description: 'Morning coffee and pastry'
  },
  { 
    id: '10', 
    title: 'Pharmacy', 
    category: 'Healthcare', 
    amount: -35.00, 
    date: 'Sep 17', 
    fullDate: 'Sep 17, 2026',
    type: 'expense',
    description: 'Prescription medication'
  },
  { 
    id: '11', 
    title: 'Refund', 
    category: 'Income', 
    amount: 89.99, 
    date: 'Sep 16', 
    fullDate: 'Sep 16, 2026',
    type: 'income',
    description: 'Product return refund'
  },
  { 
    id: '12', 
    title: 'Uber Ride', 
    category: 'Transportation', 
    amount: -22.00, 
    date: 'Sep 16', 
    fullDate: 'Sep 16, 2026',
    type: 'expense',
    description: 'Ride to downtown'
  },
  { 
    id: '13', 
    title: 'Netflix Subscription', 
    category: 'Entertainment', 
    amount: -15.99, 
    date: 'Sep 15', 
    fullDate: 'Sep 15, 2026',
    type: 'expense',
    description: 'Monthly streaming service'
  },
  { 
    id: '14', 
    title: 'ATM Withdrawal', 
    category: 'Cash', 
    amount: -100.00, 
    date: 'Sep 15', 
    fullDate: 'Sep 15, 2026',
    type: 'expense',
    description: 'Cash withdrawal'
  },
  { 
    id: '15', 
    title: 'Consulting Fee', 
    category: 'Income', 
    amount: 750.00, 
    date: 'Sep 14', 
    fullDate: 'Sep 14, 2026',
    type: 'income',
    description: 'Business consultation payment'
  },
];

export default function History() {
  const [activeTab, setActiveTab] = useState('History');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = DEMO_TRANSACTIONS;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, filterType]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expense };
  }, [filteredTransactions]);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'Home') {
      router.push('/');
    } else if (tab === 'Cards') {
      router.push('/cards');
    } else if (tab === 'History') {
      // Already on History
    } else if (tab === 'Profile') {
      router.push('/profile');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              placeholderTextColor={Colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterType('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'income' && styles.filterButtonActive]}
            onPress={() => setFilterType('income')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterButtonText, filterType === 'income' && styles.filterButtonTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'expense' && styles.filterButtonActive]}
            onPress={() => setFilterType('expense')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterButtonText, filterType === 'expense' && styles.filterButtonTextActive]}>
              Expenses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.summaryCardIncome]}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={styles.summaryAmount}>+${totals.income.toFixed(2)}</Text>
            <Text style={styles.summaryCount}>
              {filteredTransactions.filter(t => t.type === 'income').length} transactions
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardExpense]}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={styles.summaryAmount}>-${totals.expense.toFixed(2)}</Text>
            <Text style={styles.summaryCount}>
              {filteredTransactions.filter(t => t.type === 'expense').length} transactions
            </Text>
          </View>
        </View>

        {/* Scrollable Transaction List */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {filteredTransactions.map((transaction, index) => (
                <TouchableOpacity 
                  key={transaction.id} 
                  style={[
                    styles.transactionItem,
                    index === filteredTransactions.length - 1 && styles.transactionItemLast
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
                      <Text style={styles.transactionCategory}>{transaction.category}</Text>
                      <Text style={styles.transactionDescription}>{transaction.description}</Text>
                      <Text style={styles.transactionDate}>{transaction.fullDate}</Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[
                      styles.transactionAmount,
                      { color: transaction.type === 'income' ? Colors.income : Colors.text }
                    ]}>
                      {transaction.type === 'income' ? '+' : ''}{transaction.amount.toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No Transactions Found</Text>
              <Text style={styles.emptyMessage}>
                {searchQuery ? 'Try adjusting your search or filters' : 'No transactions to display'}
              </Text>
            </View>
          )}

          {/* Demo Notice */}
          <View style={styles.demoNotice}>
            <Text style={styles.demoNoticeText}>
              📊 Demo Data • All transactions are fictional
            </Text>
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
              onPress={() => handleNavigate(tab)}
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
  backButton: {
    fontSize: 28,
    color: Colors.text,
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
    paddingLeft: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.backgroundLight,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.backgroundLight,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryCardIncome: {
    backgroundColor: Colors.income + '15',
  },
  summaryCardExpense: {
    backgroundColor: Colors.expense + '15',
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 11,
    color: Colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  transactionsList: {
    marginHorizontal: 20,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 8,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  transactionItemLast: {
    borderBottomWidth: 0,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
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
    marginBottom: 3,
  },
  transactionCategory: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 3,
  },
  transactionDate: {
    fontSize: 11,
    color: Colors.textLight,
  },
  transactionRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  demoNotice: {
    marginTop: 16,
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    alignItems: 'center',
  },
  demoNoticeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
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
