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
import { getCards, updateCardStatus, Card, CardStatus } from '../services/cardService';
import { Colors } from '../constants/Colors';

// ── Display helpers ────────────────────────────────────────────────────────────

const CARD_TYPE_ICONS: Record<string, string> = {
  debit:  '💳',
  credit: '🪙',
};

const STATUS_CONFIG: Record<CardStatus, { label: string; color: string; bg: string }> = {
  active:  { label: 'Active',  color: Colors.success, bg: Colors.success + '18' },
  blocked: { label: 'Blocked', color: Colors.error,   bg: Colors.error   + '18' },
  expired: { label: 'Expired', color: Colors.textLight, bg: Colors.divider },
};

const formatExpiry = (month: number, year: number): string => {
  return `${String(month).padStart(2, '0')} / ${year}`;
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function CardsScreen() {
  const { token } = useAuth();
  const router    = useRouter();

  // ── Data state ───────────────────────────────────────────────────────────────
  const [cards, setCards]         = useState<Card[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // ── Action state ─────────────────────────────────────────────────────────────
  const [confirmCardId, setConfirmCardId]   = useState<string | null>(null);
  const [confirmAction, setConfirmAction]   = useState<'block' | 'unblock' | null>(null);
  const [actingCardId, setActingCardId]     = useState<string | null>(null);
  const [actionError, setActionError]       = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Load cards ───────────────────────────────────────────────────────────────
  const loadCards = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCards(token);
      setCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadCards(); }, [loadCards]);

  // ── Block / Unblock handlers ──────────────────────────────────────────────────
  const handleActionPress = (card: Card, action: 'block' | 'unblock') => {
    setActionError(null);
    setSuccessMessage(null);

    const actionLabel = action === 'block' ? 'Block' : 'Unblock';
    const message     = `${actionLabel} card ending in ${card.cardNumber.slice(-4)}?`;

    if (Platform.OS !== 'web') {
      Alert.alert(
        `${actionLabel} Card`,
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: `${actionLabel} Now`, style: action === 'block' ? 'destructive' : 'default',
            onPress: () => executeAction(card, action) },
        ]
      );
    } else {
      // Web: inline confirmation
      setConfirmCardId(card._id);
      setConfirmAction(action);
    }
  };

  const executeAction = async (card: Card, action: 'block' | 'unblock') => {
    if (!token) return;
    setConfirmCardId(null);
    setConfirmAction(null);
    setActingCardId(card._id);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await updateCardStatus(token, card._id, action);
      const actionLabel = action === 'block' ? 'blocked' : 'unblocked';
      setSuccessMessage(
        `Card ending in ${card.cardNumber.slice(-4)} has been ${actionLabel} successfully.`
      );
      await loadCards();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed. Please try again.');
    } finally {
      setActingCardId(null);
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
        <Text style={styles.headerTitle}>My Cards</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadCards} activeOpacity={0.7}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
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
        {(error || actionError) && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error ?? actionError}</Text>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.centerText}>Loading cards…</Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && !error && cards.length === 0 && (
          <View style={styles.centerBox}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>No cards found</Text>
            <Text style={styles.emptySubtext}>
              Cards linked to your account will appear here.
            </Text>
          </View>
        )}

        {/* Card list */}
        {!loading && cards.map((card) => {
          const statusCfg   = STATUS_CONFIG[card.status];
          const isConfirming = confirmCardId === card._id;
          const isActing     = actingCardId  === card._id;
          const canBlock     = card.status === 'active';
          const canUnblock   = card.status === 'blocked';

          return (
            <View key={card._id} style={styles.cardContainer}>
              {/* Visual card face */}
              <View style={[
                styles.cardFace,
                card.status === 'blocked'  && styles.cardFaceBlocked,
                card.status === 'expired'  && styles.cardFaceExpired,
              ]}>
                {/* Top row: icon + card type */}
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTypeIcon}>
                    {CARD_TYPE_ICONS[card.cardType] ?? '💳'}
                  </Text>
                  <Text style={styles.cardTypeLabelFace}>
                    {card.cardType.charAt(0).toUpperCase() + card.cardType.slice(1)} Card
                  </Text>
                  <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
                    <Text style={[styles.statusPillText, { color: statusCfg.color }]}>
                      {statusCfg.label}
                    </Text>
                  </View>
                </View>

                {/* Masked card number */}
                <Text style={styles.cardNumber}>{card.cardNumber}</Text>

                {/* Cardholder and expiry */}
                <View style={styles.cardBottomRow}>
                  <View>
                    <Text style={styles.cardMetaLabel}>CARD HOLDER</Text>
                    <Text style={styles.cardMetaValue}>{card.cardHolderName}</Text>
                  </View>
                  <View style={styles.cardExpiryBox}>
                    <Text style={styles.cardMetaLabel}>EXPIRES</Text>
                    <Text style={styles.cardMetaValue}>
                      {formatExpiry(card.expiryMonth, card.expiryYear)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Inline confirmation (web) */}
              {isConfirming && confirmAction && (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmText}>
                    {confirmAction === 'block'
                      ? `Block card ending in ${card.cardNumber.slice(-4)}?`
                      : `Unblock card ending in ${card.cardNumber.slice(-4)}?`}
                  </Text>
                  <View style={styles.confirmButtons}>
                    <TouchableOpacity
                      style={styles.confirmCancel}
                      onPress={() => { setConfirmCardId(null); setConfirmAction(null); }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.confirmCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.confirmAction,
                        confirmAction === 'block' && styles.confirmActionDanger,
                      ]}
                      onPress={() => executeAction(card, confirmAction)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.confirmActionText}>
                        {confirmAction === 'block' ? 'Block Now' : 'Unblock Now'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Action button row */}
              {!isConfirming && (canBlock || canUnblock) && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    canBlock   && styles.actionButtonBlock,
                    canUnblock && styles.actionButtonUnblock,
                    isActing   && styles.actionButtonDisabled,
                  ]}
                  onPress={() => handleActionPress(card, canBlock ? 'block' : 'unblock')}
                  disabled={isActing}
                  activeOpacity={0.8}
                >
                  {isActing ? (
                    <ActivityIndicator
                      color={canBlock ? Colors.backgroundLight : Colors.primary}
                      size="small"
                    />
                  ) : (
                    <Text style={[
                      styles.actionButtonText,
                      canUnblock && styles.actionButtonTextUnblock,
                    ]}>
                      {canBlock ? '🔒  Block Card' : '🔓  Unblock Card'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Expired — no action available */}
              {card.status === 'expired' && (
                <View style={styles.expiredNote}>
                  <Text style={styles.expiredNoteText}>
                    This card has expired and cannot be modified.
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

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
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 20, color: Colors.text, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  refreshButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  refreshIcon: { fontSize: 20, color: Colors.primary, fontWeight: '700' },

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },

  // Banners
  successBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.success + '18',
    borderLeftWidth: 3, borderLeftColor: Colors.success,
    borderRadius: 10, padding: 14, marginBottom: 14, gap: 10,
  },
  successIcon: { fontSize: 16, color: Colors.success, fontWeight: '700', marginTop: 1 },
  successText: { flex: 1, fontSize: 13, color: Colors.success, fontWeight: '500', lineHeight: 20 },
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

  // Card container
  cardContainer: {
    marginBottom: 16,
  },

  // Card face (visual representation)
  cardFace: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 22,
    marginBottom: 0,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  cardFaceBlocked: {
    backgroundColor: Colors.secondary,
    shadowColor: Colors.secondary,
  },
  cardFaceExpired: {
    backgroundColor: Colors.textLight,
    shadowColor: Colors.textLight,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  cardTypeIcon: { fontSize: 22 },
  cardTypeLabelFace: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.backgroundLight,
    opacity: 0.9,
    textTransform: 'capitalize',
  },
  statusPill: {
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  cardNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.backgroundLight,
    letterSpacing: 3,
    marginBottom: 20,
    fontVariant: ['tabular-nums'],
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardMetaLabel: {
    fontSize: 9,
    color: Colors.backgroundLight,
    opacity: 0.7,
    letterSpacing: 1,
    marginBottom: 3,
  },
  cardMetaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.backgroundLight,
  },
  cardExpiryBox: { alignItems: 'flex-end' },

  // Inline confirmation
  confirmBox: {
    backgroundColor: Colors.warning + '12',
    borderRadius: 12, padding: 14,
    marginTop: 8, marginBottom: 4,
  },
  confirmText: {
    fontSize: 14, color: Colors.text, fontWeight: '500',
    marginBottom: 12, textAlign: 'center',
  },
  confirmButtons: { flexDirection: 'row', gap: 10 },
  confirmCancel: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  confirmCancelText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  confirmAction: {
    flex: 1, backgroundColor: Colors.primary,
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  confirmActionDanger: { backgroundColor: Colors.error },
  confirmActionText: { fontSize: 14, fontWeight: '700', color: Colors.backgroundLight },

  // Action button
  actionButton: {
    borderRadius: 12, paddingVertical: 13,
    alignItems: 'center', marginTop: 8,
  },
  actionButtonBlock: { backgroundColor: Colors.error },
  actionButtonUnblock: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  actionButtonDisabled: { opacity: 0.6 },
  actionButtonText: { fontSize: 15, fontWeight: '700', color: Colors.backgroundLight },
  actionButtonTextUnblock: { color: Colors.primary },

  // Expired note
  expiredNote: {
    backgroundColor: Colors.divider,
    borderRadius: 10, padding: 10, marginTop: 8, alignItems: 'center',
  },
  expiredNoteText: { fontSize: 12, color: Colors.textSecondary },
});
