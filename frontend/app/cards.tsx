import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Colors';
import { router } from 'expo-router';
import { useState } from 'react';

// Type definitions
interface CardControl {
  id: string;
  icon: string;
  label: string;
  enabled: boolean;
}

// Demo card data
const DEMO_CARD = {
  cardNumber: '4532 •••• •••• 8796',
  cardholderName: 'SARAH JOHNSON',
  expiryDate: '12/28',
  cvv: '•••',
  cardType: 'Visa Debit',
  status: 'Active',
  dailyLimit: 5000,
  monthlySpent: 2847.35,
};

const CARD_CONTROLS: CardControl[] = [
  { id: '1', icon: '🌐', label: 'Online Payments', enabled: true },
  { id: '2', icon: '🏧', label: 'ATM Withdrawals', enabled: true },
  { id: '3', icon: '🌍', label: 'International', enabled: false },
  { id: '4', icon: '📱', label: 'Contactless', enabled: true },
];

export default function Cards() {
  const [activeTab, setActiveTab] = useState('Cards');
  const [cardNumberVisible, setCardNumberVisible] = useState(false);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'Home') {
      router.push('/');
    } else if (tab === 'Cards') {
      // Already on Cards
    } else if (tab === 'History') {
      router.push('/history');
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
          <Text style={styles.headerTitle}>My Cards</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Card Display */}
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              {/* Card Chip */}
              <View style={styles.cardChip}>
                <View style={styles.chipInner} />
              </View>

              {/* Card Type */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardType}>{DEMO_CARD.cardType}</Text>
                <Text style={styles.cardLogo}>VISA</Text>
              </View>

              {/* Card Number */}
              <View style={styles.cardNumberSection}>
                <Text style={styles.cardNumber}>
                  {cardNumberVisible ? '4532 1234 5678 8796' : DEMO_CARD.cardNumber}
                </Text>
                <TouchableOpacity 
                  onPress={() => setCardNumberVisible(!cardNumberVisible)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>{cardNumberVisible ? '👁' : '👁‍🗨'}</Text>
                </TouchableOpacity>
              </View>

              {/* Card Details */}
              <View style={styles.cardDetails}>
                <View style={styles.cardDetailItem}>
                  <Text style={styles.cardDetailLabel}>CARDHOLDER</Text>
                  <Text style={styles.cardDetailValue}>{DEMO_CARD.cardholderName}</Text>
                </View>
                <View style={styles.cardDetailItem}>
                  <Text style={styles.cardDetailLabel}>EXPIRES</Text>
                  <Text style={styles.cardDetailValue}>{DEMO_CARD.expiryDate}</Text>
                </View>
                <View style={styles.cardDetailItem}>
                  <Text style={styles.cardDetailLabel}>CVV</Text>
                  <Text style={styles.cardDetailValue}>{DEMO_CARD.cvv}</Text>
                </View>
              </View>

              {/* Demo Label */}
              <View style={styles.demoLabel}>
                <Text style={styles.demoText}>DEMO CARD • NOT REAL</Text>
              </View>
            </View>
          </View>

          {/* Card Status */}
          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Card Status</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{DEMO_CARD.status}</Text>
                </View>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Daily Limit</Text>
                <Text style={styles.statusValue}>${DEMO_CARD.dailyLimit.toLocaleString()}</Text>
              </View>
              <View style={[styles.statusRow, styles.statusRowLast]}>
                <Text style={styles.statusLabel}>This Month Spent</Text>
                <Text style={styles.statusValue}>${DEMO_CARD.monthlySpent.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Card Controls */}
          <View style={styles.controlsSection}>
            <Text style={styles.sectionTitle}>Card Controls</Text>
            <View style={styles.controlsList}>
              {CARD_CONTROLS.map((control, index) => (
                <TouchableOpacity
                  key={control.id}
                  style={[
                    styles.controlItem,
                    index === CARD_CONTROLS.length - 1 && styles.controlItemLast
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.controlLeft}>
                    <View style={styles.controlIcon}>
                      <Text style={styles.controlIconText}>{control.icon}</Text>
                    </View>
                    <Text style={styles.controlLabel}>{control.label}</Text>
                  </View>
                  <View style={[
                    styles.controlToggle,
                    control.enabled && styles.controlToggleActive
                  ]}>
                    <View style={[
                      styles.controlToggleThumb,
                      control.enabled && styles.controlToggleThumbActive
                    ]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.controlsNote}>
              Note: These are demo controls only. No real card actions are performed.
            </Text>
          </View>

          {/* Card Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
              <Text style={styles.actionButtonText}>🔒 Lock Card</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} activeOpacity={0.7}>
              <Text style={styles.actionButtonTextSecondary}>⚙️ Card Settings</Text>
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  cardContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    minHeight: 220,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  cardChip: {
    width: 44,
    height: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  chipInner: {
    width: 36,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardType: {
    fontSize: 12,
    color: Colors.backgroundLight,
    fontWeight: '600',
    opacity: 0.9,
    letterSpacing: 1,
  },
  cardLogo: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.backgroundLight,
    letterSpacing: 2,
  },
  cardNumberSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.backgroundLight,
    letterSpacing: 2,
  },
  eyeButton: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardDetailItem: {
    flex: 1,
  },
  cardDetailLabel: {
    fontSize: 9,
    color: Colors.backgroundLight,
    opacity: 0.7,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardDetailValue: {
    fontSize: 13,
    color: Colors.backgroundLight,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  demoLabel: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  demoText: {
    fontSize: 8,
    color: Colors.backgroundLight,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  statusRowLast: {
    borderBottomWidth: 0,
  },
  statusLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
  },
  statusValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  controlsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  controlsList: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 8,
    marginBottom: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  controlItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  controlItemLast: {
    borderBottomWidth: 0,
  },
  controlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  controlIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  controlIconText: {
    fontSize: 18,
  },
  controlLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  controlToggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  controlToggleActive: {
    backgroundColor: Colors.accent,
  },
  controlToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  controlToggleThumbActive: {
    alignSelf: 'flex-end',
  },
  controlsNote: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonSecondary: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.backgroundLight,
  },
  actionButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
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
