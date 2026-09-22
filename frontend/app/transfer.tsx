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
import { transferFunds } from '../services/transferService';
import { Colors } from '../constants/Colors';

export default function TransferScreen() {
  const { token } = useAuth();
  const router    = useRouter();

  // ── Account state ───────────────────────────────────────────────────────────
  const [accounts, setAccounts]           = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // ── Form state ──────────────────────────────────────────────────────────────
  const [recipientAccountId, setRecipientAccountId] = useState('');
  const [amount, setAmount]                         = useState('');
  const [description, setDescription]               = useState('');

  // ── Submit state ─────────────────────────────────────────────────────────────
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Load accounts on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const fetchAccounts = async () => {
      setAccountsLoading(true);
      try {
        const data = await getAccounts(token);
        setAccounts(data);
        // Auto-select the first (or only) account
        if (data.length > 0) {
          setSelectedAccountId(data[0]._id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load your accounts.'
        );
      } finally {
        setAccountsLoading(false);
      }
    };

    fetchAccounts();
  }, [token]);

  // ── Derived values ────────────────────────────────────────────────────────────
  const selectedAccount = accounts.find(a => a._id === selectedAccountId);

  // ── Submit handler ────────────────────────────────────────────────────────────
  const handleTransfer = async () => {
    setError(null);
    setSuccessMessage(null);

    // Client-side validation
    if (!selectedAccountId) {
      setError('No source account available.');
      return;
    }
    if (!recipientAccountId.trim()) {
      setError('Please enter the recipient account ID.');
      return;
    }
    if (recipientAccountId.trim() === selectedAccountId) {
      setError('Source and recipient accounts must be different.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (selectedAccount && parsedAmount > selectedAccount.balance) {
      setError(
        `Insufficient balance. Available: ${selectedAccount.currency} ${selectedAccount.balance.toFixed(2)}`
      );
      return;
    }

    setLoading(true);
    try {
      const response = await transferFunds(
        token!,
        selectedAccountId,
        recipientAccountId.trim(),
        parsedAmount,
        description.trim() || undefined
      );

      setSuccessMessage(
        `Transfer of ${selectedAccount?.currency ?? 'INR'} ${parsedAmount.toFixed(2)} completed. Reference: ${response.transaction.reference}`
      );
      // Clear the transaction fields, keep source account selection
      setRecipientAccountId('');
      setAmount('');
      setDescription('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Transfer failed. Please try again.'
      );
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Money</Text>
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
          {/* Success banner */}
          {successMessage && (
            <View style={styles.successBanner}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Error banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Source account card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>From Account</Text>

            {accountsLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
            ) : accounts.length === 0 ? (
              <Text style={styles.noAccountText}>No accounts found.</Text>
            ) : accounts.length === 1 ? (
              // Single account — display only, no selection needed
              <View style={styles.accountDisplay}>
                <Text style={styles.accountNumber}>{accounts[0].accountNumber}</Text>
                <Text style={styles.accountBalance}>
                  {accounts[0].currency} {accounts[0].balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ) : (
              // Multiple accounts — let user pick
              <>
                <Text style={styles.fieldLabel}>Select source account</Text>
                {accounts.map(acc => (
                  <TouchableOpacity
                    key={acc._id}
                    style={[
                      styles.accountOption,
                      acc._id === selectedAccountId && styles.accountOptionSelected,
                    ]}
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

          {/* Transfer details card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transfer Details</Text>

            {/* Recipient account ID */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Recipient Account ID</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 6ab086c25a452c2093e9709f"
                placeholderTextColor={Colors.textLight}
                value={recipientAccountId}
                onChangeText={v => { setRecipientAccountId(v); setError(null); setSuccessMessage(null); }}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <Text style={styles.fieldHint}>
                Enter the MongoDB account ID of the recipient's account.
              </Text>
            </View>

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
                  onChangeText={v => { setAmount(v); setError(null); setSuccessMessage(null); }}
                  keyboardType="decimal-pad"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Description (optional) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Description <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rent, Groceries…"
                placeholderTextColor={Colors.textLight}
                value={description}
                onChangeText={v => { setDescription(v); }}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleTransfer}
              />
            </View>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.button, (loading || accountsLoading) && styles.buttonDisabled]}
            onPress={handleTransfer}
            disabled={loading || accountsLoading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.backgroundLight} size="small" />
            ) : (
              <Text style={styles.buttonText}>Send Money</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
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
  headerSpacer: {
    width: 36,
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
    marginBottom: 16,
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
    fontSize: 14,
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
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
  },

  // Cards
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },

  // Account display (single)
  accountDisplay: {
    backgroundColor: Colors.primary + '12',
    borderRadius: 12,
    padding: 14,
  },
  accountNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  noAccountText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },

  // Account options (multiple)
  accountOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  accountOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  accountOptionLeft: {
    flex: 1,
  },
  accountOptionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  accountOptionType: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  accountOptionBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 12,
  },

  // Form fields
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  optional: {
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  fieldHint: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.background,
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currencyTag: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 12,
    overflow: 'hidden',
  },
  amountInput: {
    fontSize: 20,
    fontWeight: '600',
  },

  // Submit button
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.backgroundLight,
    letterSpacing: 0.3,
  },
});
