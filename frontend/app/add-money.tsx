import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { getAccounts, Account } from '../services/accountService';
import { depositFunds } from '../services/depositService';
import { Colors } from '../constants/Colors';

export default function AddMoneyScreen() {
  const { token } = useAuth();
  const router    = useRouter();

  // ── Account state ─────────────────────────────────────────────────────────────
  const [accounts, setAccounts]               = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // ── Form state ────────────────────────────────────────────────────────────────
  const [amount, setAmount]           = useState('');
  const [description, setDescription] = useState('');

  // ── Submit state ──────────────────────────────────────────────────────────────
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Load accounts on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const fetchAccounts = async () => {
      setAccountsLoading(true);
      try {
        const data = await getAccounts(token);
        const active = data.filter(a => a.status === 'active');
        setAccounts(active);
        if (active.length > 0) setSelectedAccountId(active[0]._id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load accounts.');
      } finally {
        setAccountsLoading(false);
      }
    };

    fetchAccounts();
  }, [token]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const selectedAccount = accounts.find(a => a._id === selectedAccountId);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleDeposit = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!selectedAccountId) {
      setError('No account selected.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    setLoading(true);
    try {
      const result = await depositFunds(
        token!,
        selectedAccountId,
        parsedAmount,
        description.trim() || undefined
      );

      setSuccessMessage(
        `${selectedAccount?.currency ?? 'INR'} ${parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} added successfully! Ref: ${result.transaction.reference}`
      );
      setAmount('');
      setDescription('');

      // Navigate back to dashboard after a short delay so the user can read the confirmation
      setTimeout(() => router.replace('/'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Money</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Demo notice */}
          <View style={styles.noticeBanner}>
            <Text style={styles.noticeText}>
              🎓  Demo feature — simulates adding money to your account for testing purposes.
            </Text>
          </View>

          {/* Success banner */}
          {successMessage && (
            <View style={styles.successBanner}>
              <Text style={styles.successIcon}>✓</Text>
              <View style={styles.successBody}>
                <Text style={styles.successText}>{successMessage}</Text>
                <Text style={styles.successSub}>Returning to dashboard…</Text>
              </View>
            </View>
          )}

          {/* Error banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Account selection card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Money To</Text>

            {accountsLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
            ) : accounts.length === 0 ? (
              <Text style={styles.noAccountText}>No active accounts found.</Text>
            ) : accounts.length === 1 ? (
              <View style={styles.accountDisplay}>
                <View style={styles.accountDisplayLeft}>
                  <Text style={styles.accountNumber}>{accounts[0].accountNumber}</Text>
                  <Text style={styles.accountType}>{accounts[0].accountType} account</Text>
                </View>
                <Text style={styles.accountBalance}>
                  {accounts[0].currency} {accounts[0].balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Select account</Text>
                {accounts.map(acc => (
                  <TouchableOpacity
                    key={acc._id}
                    style={[styles.accountOption, acc._id === selectedAccountId && styles.accountOptionSelected]}
                    onPress={() => { setSelectedAccountId(acc._id); setError(null); }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.accountOptionLeft}>
                      <Text style={styles.accountOptionNumber}>{acc.accountNumber}</Text>
                      <Text style={styles.accountOptionType}>{acc.accountType}</Text>
                    </View>
                    <Text style={styles.accountOptionBalance}>
                      {acc.currency} {acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>

          {/* Amount & description card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Deposit Details</Text>

            {/* Amount */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Amount</Text>
              <View style={styles.amountRow}>
                <Text style={styles.currencyTag}>
                  {selectedAccount?.currency ?? 'INR'}
                </Text>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textLight}
                  value={amount}
                  onChangeText={v => { setAmount(v); setError(null); }}
                  keyboardType="decimal-pad"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Description <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Salary, Savings top-up…"
                placeholderTextColor={Colors.textLight}
                value={description}
                onChangeText={setDescription}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleDeposit}
              />
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.button, (loading || accountsLoading || !!successMessage) && styles.buttonDisabled]}
            onPress={handleDeposit}
            disabled={loading || accountsLoading || !!successMessage}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.backgroundLight} size="small" />
            ) : (
              <Text style={styles.buttonText}>Add Money</Text>
            )}
          </TouchableOpacity>

          {/* Manual back button always available */}
          <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/')} activeOpacity={0.7}>
            <Text style={styles.backLinkText}>← Back to Dashboard</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.backgroundLight,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 20, color: Colors.text, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  headerSpacer: { width: 36 },

  // Notice
  noticeBanner: {
    backgroundColor: Colors.accent + '14',
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 16,
  },
  noticeText: { fontSize: 13, color: Colors.accent, lineHeight: 18 },

  // Banners
  successBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.success + '18',
    borderLeftWidth: 3, borderLeftColor: Colors.success,
    borderRadius: 10, padding: 14, marginBottom: 16, gap: 10,
  },
  successIcon: { fontSize: 16, color: Colors.success, fontWeight: '700', marginTop: 1 },
  successBody: { flex: 1 },
  successText: { fontSize: 14, color: Colors.success, fontWeight: '600', lineHeight: 20 },
  successSub:  { fontSize: 12, color: Colors.success, opacity: 0.8, marginTop: 2 },
  errorBanner: {
    backgroundColor: Colors.error + '18',
    borderLeftWidth: 3, borderLeftColor: Colors.error,
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 16,
  },
  errorText: { fontSize: 14, color: Colors.error, fontWeight: '500' },

  // Cards
  card: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 16 },

  // Single account display
  accountDisplay: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primary + '10', borderRadius: 12, padding: 14,
  },
  accountDisplayLeft: { flex: 1 },
  accountNumber: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  accountType:   { fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize' },
  accountBalance:{ fontSize: 14, fontWeight: '700', color: Colors.primary },
  noAccountText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 8 },

  // Multiple account options
  accountOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  accountOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  accountOptionLeft: { flex: 1 },
  accountOptionNumber: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  accountOptionType: { fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize' },
  accountOptionBalance: { fontSize: 14, fontWeight: '600', color: Colors.primary, marginLeft: 12 },

  // Form
  fieldGroup: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  optional: { fontWeight: '400', color: Colors.textSecondary },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: Colors.text, backgroundColor: Colors.background, flex: 1,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  currencyTag: {
    fontSize: 14, fontWeight: '700', color: Colors.accent,
    backgroundColor: Colors.accent + '14',
    paddingHorizontal: 12, paddingVertical: 13, borderRadius: 12, overflow: 'hidden',
  },
  amountInput: { fontSize: 20, fontWeight: '600' },

  // Submit
  button: {
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '700', color: Colors.backgroundLight, letterSpacing: 0.3 },

  // Back link
  backLink: { alignItems: 'center', marginTop: 16 },
  backLinkText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
});
